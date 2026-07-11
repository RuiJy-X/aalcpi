<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::query()
            ->with('permissions:id,name')
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'users_count' => $role->users_count,
                'permissions' => $role->permissions->pluck('name')->values(),
                'is_super_admin' => $role->name === Permissions::SUPER_ADMIN_ROLE,
            ]);

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'permissionGroups' => Permissions::forUi(),
            'resourceLabels' => Permissions::resourceLabels(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(Permissions::all())],
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return back()->with('success', 'Role created successfully.');
    }

    public function show(Role $role)
    {
        $role->load('permissions:id,name');

        return Inertia::render('Roles/Show', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->values(),
                'is_super_admin' => $role->name === Permissions::SUPER_ADMIN_ROLE,
            ],
            'permissionGroups' => Permissions::forUi(),
            'resourceLabels' => Permissions::resourceLabels(),
        ]);
    }

    public function update(Request $request, Role $role)
    {
        if ($role->name === Permissions::SUPER_ADMIN_ROLE) {
            // Super admin always keeps all permissions; only allow renaming is disallowed
            return back()->with('error', 'The super admin role cannot be modified.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($role->id)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(Permissions::all())],
        ]);

        $role->update(['name' => $validated['name']]);
        $role->syncPermissions($validated['permissions'] ?? []);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role)
    {
        if ($role->name === Permissions::SUPER_ADMIN_ROLE) {
            return back()->with('error', 'The super admin role cannot be deleted.');
        }

        if ($role->users()->count() > 0) {
            return back()->with('error', 'Cannot delete a role that is assigned to users.');
        }

        $role->delete();
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return back()->with('success', 'Role deleted successfully.');
    }
}
