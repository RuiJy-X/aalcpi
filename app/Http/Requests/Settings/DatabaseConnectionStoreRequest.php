<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class DatabaseConnectionStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->isManager();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'connection_name' => ['required', 'string', 'max:255', 'unique:database_connections,connection_name'],
            'driver' => ['required', 'string', 'in:pgsql,mysql'],
            'host' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer', 'min:1', 'max:65535'],
            'database' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'charset' => ['sometimes', 'string', 'max:100'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'connection_name.required' => 'Connection name is required',
            'connection_name.unique' => 'A connection with this name already exists',
            'host.required' => 'Database host is required',
            'port.required' => 'Database port is required',
            'database.required' => 'Database name is required',
            'username.required' => 'Database username is required',
            'password.required' => 'Database password is required',
        ];
    }
}
