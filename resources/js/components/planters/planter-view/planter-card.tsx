import React from 'react';
import { PlanterRow } from '../planters-table-types';
import { Calendar, Captions, Code, Mail, Phone, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import image from '/storage/images/user-vector.jpg';

const PlanterCard = ({ planter }: { planter: PlanterRow }) => {
    return (
        <div className="flex w-auto items-stretch gap-2 overflow-hidden rounded-md border-l-4 border-primary bg-white px-5 py-4 shadow-sm">
            <div className="">
                <img src={image} alt="" className="size-32" />
            </div>
            <div className="flex h-full flex-col items-start justify-center gap-1 self-center">
                <div className="text-dark mb-1 truncate text-2xl font-bold tracking-tight">
                    {planter.name}
                    {/* <Badge className="position-absolute ml-5 -translate-y-1">
                        Active
                    </Badge> */}
                </div>
                <div className="text-xs text-gray-500">
                    Code: {planter.planter_code}
                </div>
            </div>
        </div>
    );
};

export default PlanterCard;
