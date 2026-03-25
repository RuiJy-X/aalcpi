import React from 'react';
import { PlanterWithRelations } from '../planters-table-types';
import { ArrowRight, Dot } from 'lucide-react';
import { show as haciendaShow } from '@/routes/haciendas';

import { router } from '@inertiajs/react';

const ActiveHaciendas = ({
    planter,
    setActiveTab,
}: {
    planter: PlanterWithRelations;
    setActiveTab: (tab: string) => void;
}) => {
    const handleClick = (key: string) => {
        router.get(haciendaShow(key).url);
    };
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="text-dark flex justify-between border-l-4 border-green-900 p-2 text-lg font-semibold tracking-tight">
                Active Haciendas
                <div
                    className="cursor-pointer text-primary transition-transform duration-200 hover:-translate-y-1"
                    onClick={() => setActiveTab('haciendas')}
                >
                    View All <ArrowRight className="inline" />
                </div>
            </div>
            <div className="flex gap-3 overflow-x-auto overflow-y-visible px-4 py-5">
                {planter.haciendas.map((hacienda) => (
                    <div
                        className="flex min-w-lg cursor-pointer flex-col gap-5 rounded-md bg-white px-5 py-4 shadow-sm transition-transform delay-100 duration-200 hover:translate-y-[-2px] hover:bg-green-50"
                        key={hacienda.id}
                        onClick={() => handleClick(hacienda.id)}
                    >
                        <div className="flex flex-col">
                            <div className="text-xl font-bold tracking-tight text-primary">
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
                ))}
            </div>
        </div>
    );
};

export default ActiveHaciendas;
