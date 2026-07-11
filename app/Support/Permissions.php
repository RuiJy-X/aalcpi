<?php

namespace App\Support;

/**
 * Central registry of application permissions.
 * Each resource with CRUD (and related) actions maps to a permission name.
 */
class Permissions
{
    public const SUPER_ADMIN_ROLE = 'super_admin';

    /**
     * Resource => [action => permission name]
     *
     * @return array<string, array<string, string>>
     */
    public static function structure(): array
    {
        return [
            'users' => [
                'view' => 'users.view',
                'create' => 'users.create',
                'update' => 'users.update',
                'delete' => 'users.delete',
            ],
            'roles' => [
                'view' => 'roles.view',
                'create' => 'roles.create',
                'update' => 'roles.update',
                'delete' => 'roles.delete',
            ],
            'employees' => [
                'view' => 'employees.view',
                'create' => 'employees.create',
                'update' => 'employees.update',
                'delete' => 'employees.delete',
            ],
            'attendance' => [
                'view' => 'attendance.view',
                'create' => 'attendance.create',
                'update' => 'attendance.update',
                'delete' => 'attendance.delete',
                'import' => 'attendance.import',
            ],
            'payroll' => [
                'view' => 'payroll.view',
                'create' => 'payroll.create',
                'update' => 'payroll.update',
                'delete' => 'payroll.delete',
                'generate' => 'payroll.generate',
            ],
            'milling_periods' => [
                'view' => 'milling_periods.view',
                'create' => 'milling_periods.create',
                'update' => 'milling_periods.update',
                'delete' => 'milling_periods.delete',
            ],
            'planters' => [
                'view' => 'planters.view',
                'create' => 'planters.create',
                'update' => 'planters.update',
                'delete' => 'planters.delete',
                'import' => 'planters.import',
            ],
            'productions' => [
                'view' => 'productions.view',
                'create' => 'productions.create',
                'update' => 'productions.update',
                'delete' => 'productions.delete',
                'import' => 'productions.import',
            ],
            'haciendas' => [
                'view' => 'haciendas.view',
                'create' => 'haciendas.create',
                'update' => 'haciendas.update',
                'delete' => 'haciendas.delete',
            ],
            'weekly' => [
                'view' => 'weekly.view',
                'create' => 'weekly.create',
                'update' => 'weekly.update',
                'delete' => 'weekly.delete',
            ],
            'bank_reconciliation' => [
                'view' => 'bank_reconciliation.view',
                'create' => 'bank_reconciliation.create',
                'update' => 'bank_reconciliation.update',
                'delete' => 'bank_reconciliation.delete',
            ],
        ];
    }

    /**
     * Human-readable labels for UI grouping.
     *
     * @return array<string, string>
     */
    public static function resourceLabels(): array
    {
        return [
            'users' => 'Users',
            'roles' => 'Roles',
            'employees' => 'Employees',
            'attendance' => 'Attendance',
            'payroll' => 'Payroll',
            'milling_periods' => 'Milling Periods',
            'planters' => 'Planters',
            'productions' => 'Productions',
            'haciendas' => 'Haciendas',
            'weekly' => 'Weekly Data',
            'bank_reconciliation' => 'Bank Reconciliation',
        ];
    }

    /**
     * Human-readable labels for actions.
     *
     * @return array<string, string>
     */
    public static function actionLabels(): array
    {
        return [
            'view' => 'View',
            'create' => 'Create',
            'update' => 'Update',
            'delete' => 'Delete',
            'import' => 'Import',
            'generate' => 'Generate',
        ];
    }

    /**
     * Flat list of every permission name.
     *
     * @return list<string>
     */
    public static function all(): array
    {
        $names = [];

        foreach (self::structure() as $actions) {
            foreach ($actions as $permission) {
                $names[] = $permission;
            }
        }

        return $names;
    }

    /**
     * Permissions grouped for Inertia forms: resource => [{ name, action, label }]
     *
     * @return array<string, list<array{name: string, action: string, label: string}>>
     */
    public static function forUi(): array
    {
        $actionLabels = self::actionLabels();
        $grouped = [];

        foreach (self::structure() as $resource => $actions) {
            $grouped[$resource] = [];
            foreach ($actions as $action => $name) {
                $grouped[$resource][] = [
                    'name' => $name,
                    'action' => $action,
                    'label' => $actionLabels[$action] ?? ucfirst($action),
                ];
            }
        }

        return $grouped;
    }

    /**
     * Default permission sets for built-in roles (excluding super_admin).
     *
     * @return array<string, list<string>>
     */
    public static function defaultRolePermissions(): array
    {
        return [
            'manager' => self::all(),
            'cert_officer' => [
                'planters.view',
                'planters.create',
                'planters.update',
                'planters.import',
                'productions.view',
                'productions.create',
                'productions.update',
                'productions.import',
                'haciendas.view',
                'haciendas.create',
                'haciendas.update',
                'weekly.view',
                'weekly.create',
                'bank_reconciliation.view',
                'bank_reconciliation.create',
            ],
            'employee' => [
                'planters.view',
                'productions.view',
                'haciendas.view',
                'weekly.view',
            ],
        ];
    }
}
