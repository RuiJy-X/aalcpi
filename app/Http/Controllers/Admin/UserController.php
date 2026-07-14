<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HandlesBulkUpdates;
use App\Models\Employee;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UserController extends Controller
{
    use HandlesBulkUpdates;

    public function index()
    {
        $users = User::query()
            ->with(['roles:id,name', 'permissions:id,name'])
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => $this->transformUser($user));

        return Inertia::render('Users/Index', [
            'users' => $users,
            'employees' => Employee::all(),
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'permissionGroups' => Permissions::forUi(),
            'resourceLabels' => Permissions::resourceLabels(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'min:8'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(Permissions::all())],
        ]);

        $this->assertCanAssignRoles($request->user(), $validated['roles'] ?? []);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
        ]);

        $user->syncRoles($validated['roles'] ?? []);
        $user->syncPermissions($validated['permissions'] ?? []);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return back()->with('success', 'User created successfully!');
    }

    public function bulkUpdate(Request $request)
    {
        return $this->performBulkUpdate(
            $request,
            User::class,
            [
                'name' => ['sometimes', 'nullable', 'string', 'max:255'],
                'email' => ['sometimes', 'nullable', 'email', 'max:255'],
                'username' => ['sometimes', 'nullable', 'string', 'max:255'],
            ],
            successLabel: 'user',
        );
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'password' => ['nullable', 'min:8'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(Permissions::all())],
        ]);

        $this->assertCanAssignRoles($request->user(), $validated['roles'] ?? []);
        $this->assertNotStrippingLastSuperAdmin($user, $validated['roles'] ?? []);

        $payload = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'],
        ];

        if (! empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        $user->update($payload);
        $user->syncRoles($validated['roles'] ?? []);
        $user->syncPermissions($validated['permissions'] ?? []);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', 'User updated successfully!');
    }

    public function show($id)
    {
        $user = User::with(['roles:id,name', 'permissions:id,name'])->findOrFail($id);

        return Inertia::render('Users/Show', [
            'user' => $this->transformUser($user),
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'permissionGroups' => Permissions::forUi(),
            'resourceLabels' => Permissions::resourceLabels(),
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($user->isSuperAdmin()) {
            $superAdminCount = User::role(Permissions::SUPER_ADMIN_ROLE)->count();
            if ($superAdminCount <= 1) {
                return back()->with('error', 'Cannot delete the last super admin.');
            }
        }

        if (auth()->id() === $user->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        $ids = collect($validated['ids'])->reject(fn ($id) => (int) $id === auth()->id());

        $superAdminIds = User::role(Permissions::SUPER_ADMIN_ROLE)->pluck('id');
        $remainingSuperAdmins = $superAdminIds->diff($ids);

        if ($remainingSuperAdmins->isEmpty() && $superAdminIds->isNotEmpty()) {
            return back()->with('error', 'Cannot delete all super admin users.');
        }

        User::whereIn('id', $ids)->delete();

        return back()->with('success', 'Selected users deleted successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'roles' => $user->roles->pluck('name')->values(),
            'permissions' => $user->getDirectPermissions()->pluck('name')->values(),
            'all_permissions' => $user->getAllPermissions()->pluck('name')->values(),
            'is_super_admin' => $user->isSuperAdmin(),
        ];
    }

    /**
     * Only super admins may assign the super_admin role.
     *
     * @param  list<string>  $roles
     */
    private function assertCanAssignRoles(User $actor, array $roles): void
    {
        if (in_array(Permissions::SUPER_ADMIN_ROLE, $roles, true) && ! $actor->isSuperAdmin()) {
            abort(403, 'Only a super admin can assign the super admin role.');
        }
    }

    /**
     * @param  list<string>  $newRoles
     */
    private function assertNotStrippingLastSuperAdmin(User $user, array $newRoles): void
    {
        if (! $user->isSuperAdmin()) {
            return;
        }

        if (in_array(Permissions::SUPER_ADMIN_ROLE, $newRoles, true)) {
            return;
        }

        $otherSuperAdmins = User::role(Permissions::SUPER_ADMIN_ROLE)
            ->where('id', '!=', $user->id)
            ->count();

        if ($otherSuperAdmins === 0) {
            abort(422, 'Cannot remove the super admin role from the last super admin.');
        }
    }
}
