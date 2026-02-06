import React from 'react';
import { Input } from '../ui/input';

const BasicDetails = () => {
    return (
        <div className="mb-2 self-center rounded-md border border-gray-200">
            <h1 className="border-b border-gray-200 px-5 py-2 text-foreground">
                Basic Details
            </h1>
            <div className="px-5 py-2 text-foreground">
                <form action="" className="grid">
                    <Input title="Name" placeholder="Your Name" />
                    <Input title="Address" placeholder="Your Address" />
                    <div className="grid grid-cols-2 gap-5">
                        <Input title="Email" placeholder="johndoe@email.com" />
                        <Input title="Phone" placeholder="" />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BasicDetails;
