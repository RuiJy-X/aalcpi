import React from 'react';
import { PlanterWithRelations } from '../planters-table-types';
import { MapPin, Phone } from 'lucide-react';

const PlanterInfo = ({ planter }: { planter: PlanterWithRelations }) => {
    return (
        <div className="flex flex-col gap-5 rounded-md border bg-white p-6">
            <div className="text-dark border-l-4 border-green-900 p-2 text-lg font-semibold tracking-tight">
                Personal Information
            </div>
            <div className="grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-3 md:divide-x md:divide-y-0">
                {/* Location */}
                <div className="flex w-full flex-col gap-2 py-4 md:px-5 md:py-2">
                    <div className="text-sm font-semibold tracking-wide text-gray-500">
                        ADDRESS
                    </div>
                    <div className="flex text-base font-medium text-gray-700">
                        <MapPin className="mt-0.5 mr-2 inline h-5 w-5 shrink-0 text-green-700" />
                        {planter.address}
                    </div>
                </div>
                {/* Contact */}
                <div className="flex w-full flex-col gap-2 py-4 md:px-5 md:py-2">
                    <div className="text-sm font-semibold tracking-wide text-gray-500">
                        CONTACT NUMBER
                    </div>
                    <div className="flex text-base font-medium text-gray-700">
                        <Phone className="mt-0.5 mr-2 inline h-5 w-5 shrink-0 text-green-700" />

                        {planter.contact_number}
                    </div>
                </div>
                {/* Tin */}
                <div className="flex w-full flex-col gap-2 py-4 md:px-5 md:py-2">
                    <div className="text-sm font-semibold tracking-wide text-gray-500">
                        TAX IDENTIFICATION NUMBER (TIN)
                    </div>
                    <div className="flex w-fit rounded-sm bg-gray-200 px-5 py-5 text-base font-medium tracking-wide text-foreground">
                        {planter.tin_number}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanterInfo;
