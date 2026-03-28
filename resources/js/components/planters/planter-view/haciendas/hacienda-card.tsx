import React from 'react';
import { router } from '@inertiajs/react';
import { HaciendaRow } from '../../planters-table-types';
import { Dot } from 'lucide-react';
import { show as haciendaShow } from '@/routes/haciendas';

const HaciendaCard = ({
    hacienda,
    className,
}: {
    hacienda: HaciendaRow;
    className?: string;
}) => {
    const handleClick = (key: string) => {
        router.get(haciendaShow(key).url);
    };
    return (
        <div
            className={`flex min-w-lg cursor-pointer flex-col gap-5 rounded-md bg-white bg-gradient-to-br from-green-200 to-white px-5 py-4 shadow-sm transition-transform delay-100 duration-200 hover:translate-y-[-2px] hover:bg-green-50 ${className || ''}`}
            key={hacienda.id}
            onClick={() => handleClick(hacienda.id)}
        >
            <div className="flex flex-col">
                <div className="text-xs font-semibold tracking-wide text-gray-500">
                    HACIENDA
                </div>
                <div className="text-dark text-2xl font-bold tracking-tight">
                    {hacienda.name}
                </div>
                <div className="text-xs font-semibold tracking-wide">
                    <Dot className="inline text-green-500" />
                    <div className="inline text-gray-500">
                        {hacienda.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                </div>
            </div>
            <div className="flex w-full justify-start gap-5">
                {/* Area */}
                <div className="flex-1">
                    <div className="text-sm font-semibold tracking-wide text-gray-500">
                        AREA
                    </div>
                    <div className="text-dark text-lg font-semibold">
                        {hacienda.area_hectares} ha
                    </div>
                </div>
                {/* Proximity */}
                <div className="flex-1">
                    <div className="text-sm font-semibold tracking-wide text-gray-500">
                        PROXIMITY
                    </div>
                    <div className="text-dark text-lg font-semibold">
                        {hacienda.distance_from_urc} km
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HaciendaCard;
