<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

trait HandlesBulkUpdates
{
    /**
     * Validate and apply bulk row updates for a model from the datatable editor.
     *
     * @param  class-string<Model>  $modelClass
     * @param  array<string, mixed>  $fieldRules  Field => validation rules (without rows.* prefix)
     * @param  (callable(Model, array<string, mixed>): array<string, mixed>)|null  $transformRow
     */
    protected function performBulkUpdate(
        Request $request,
        string $modelClass,
        array $fieldRules,
        ?callable $transformRow = null,
        string $successLabel = 'record',
    ): RedirectResponse {
        /** @var Model $modelInstance */
        $modelInstance = new $modelClass;
        $table = $modelInstance->getTable();

        $rules = [
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.id' => ['required', 'integer', 'distinct', "exists:{$table},id"],
        ];

        foreach ($fieldRules as $field => $rule) {
            $rules["rows.*.{$field}"] = $rule;
        }

        $validated = $request->validate($rules);
        $updatable = array_keys($fieldRules);
        $updatedCount = 0;

        DB::transaction(function () use ($validated, $modelClass, $updatable, $transformRow, &$updatedCount) {
            foreach ($validated['rows'] as $row) {
                /** @var Model $model */
                $model = $modelClass::query()->findOrFail($row['id']);
                $payload = collect($row)->only($updatable)->all();

                if ($transformRow !== null) {
                    $payload = $transformRow($model, $payload);
                }

                if ($payload === []) {
                    continue;
                }

                $model->update($payload);
                $updatedCount++;
            }
        });

        $plural = $updatedCount === 1 ? $successLabel : $successLabel.'s';

        return redirect()
            ->back()
            ->with('success', "Updated {$updatedCount} {$plural}.");
    }
}
