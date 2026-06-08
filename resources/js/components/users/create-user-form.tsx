import React from 'react';
import { useForm } from '@inertiajs/react';
import { Input } from '../ui/input';
import { Field } from '../ui/field';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { User } from 'lucide-react';
import { store as userStore } from '@/routes/users';

const CreateUserForm = () => {
    const { data, setData, errors, processing, reset, post } = useForm({
        name: '',
        email: '',
        username: '',
        password: '',
        role: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(data);
        post(userStore().url, {
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <div className="">
            <form
                id="create-user-form"
                onSubmit={handleSubmit}
                className="mt-5 grid grid-cols-2 gap-4"
            >
                <Field>
                    <Label>Name</Label>
                    <Input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.name}
                        </p>
                    )}
                </Field>

                <Field>
                    <Label>Username</Label>
                    <Input
                        type="text"
                        value={data.username}
                        onChange={(e) => setData('username', e.target.value)}
                    />
                    {errors.username && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.username}
                        </p>
                    )}
                </Field>

                <Field>
                    <Label>Email</Label>
                    <Input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.email}
                        </p>
                    )}
                </Field>
                <Field>
                    <Label>Password</Label>
                    <Input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.password}
                        </p>
                    )}
                </Field>
                <Field>
                    <Label>Role</Label>
                    <Input
                        type="text"
                        value={data.role}
                        onChange={(e) => setData('role', e.target.value)}
                    />
                    {errors.role && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.role}
                        </p>
                    )}
                </Field>
                <div></div>
                <Button type="submit" disabled={processing} className="w-30">
                    Create User
                </Button>
            </form>
        </div>
    );
};

export default CreateUserForm;
