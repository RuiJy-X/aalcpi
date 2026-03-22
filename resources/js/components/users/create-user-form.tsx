import React from 'react';
import { useForm } from '@inertiajs/react';

const CreateUserForm = () => {
    const { data, setData, errors, processing } = useForm({
        name: '',
        email: '',
        password: '',
        role: '',
    });

    return <div>create-user-form</div>;
};

export default CreateUserForm;
