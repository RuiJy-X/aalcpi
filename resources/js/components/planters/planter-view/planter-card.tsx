import React from 'react';
import { PlanterRow } from '../planters-table-types';
import { Calendar, Captions, Code, Mail, Phone, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import image from '/storage/images/user-vector.jpg';
import { show as planterShow } from '@/routes/planters';
import { router } from '@inertiajs/react';

const PlanterCard = ({
    planter,
    className,
}: {
    planter: PlanterRow;
    className?: string;
}) => {
    return (
        <div
            onClick={() => router.get(planterShow(planter.id))}
            className={`flex w-auto items-stretch gap-2 overflow-hidden rounded-md border border-l-4 bg-white px-5 py-4 shadow-lg transition-all delay-50 hover:-translate-y-1 ${className || ''}`}
        >
            <div className="">
                <img src={image} alt="" className="size-32" />
            </div>
            <div className="flex h-full flex-col items-start justify-center gap-1 self-center">
                <div className="text-xs font-semibold tracking-wide text-gray-500">
                    PLANTER
                </div>
                <div className="text-dark mb-1 truncate text-2xl font-bold tracking-tight">
                    {planter.name}
                    {/* <Badge className="position-absolute ml-5 -translate-y-1">
                        Active
                    </Badge> */}
                </div>
                <div className="text-xs text-gray-500">
                    Code: {planter.planter_code}
                </div>
                <div className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Calendar size={13} />
                    {planter.registration_date}
                </div>
            </div>
        </div>
    );
};

export default PlanterCard;
