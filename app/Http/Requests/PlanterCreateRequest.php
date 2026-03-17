<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlanterCreateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'planter_code' => 'required|string|max:255|unique:planters,planter_code',
            'name'           => 'required|string|max:255',
            'address'        => 'required|string',
            'contact_number' => 'required|string',
            'tin_number'     => 'required|string|unique:planters,tin_number',
            'registration_date' => (now()->toDateString() >= $request->registration_date) ? 'required|date' : 'required|date|before_or_equal:today',
            'haciendas' => 'nullable|array',
            'haciendas.*.name' => 'required_with:haciendas|string|max:255',
            'haciendas.*.HACIENDA_code' => 'required_with:haciendas|string|max:255|unique:haciendas,HACIENDA_code',
            'haciendas.*.address' => 'required_with:haciendas|string|max:255',
            'haciendas.*.area_hectares' => 'required_with:haciendas|numeric|min:0',
            'haciendas.*.distance_from_urc' => 'required_with:haciendas|numeric|min:0',
            'haciendas.*.is_active' => 'required_with:haciendas|boolean',
        ];
    }
}
