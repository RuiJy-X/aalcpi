import React from 'react';
import { PlanterWithRelations } from '../../planters-table-types';
import { ArrowRight, Dot } from 'lucide-react';
import { show as haciendaShow } from '@/routes/haciendas';

import { router } from '@inertiajs/react';
import HaciendaCard from './hacienda-card';

const ActiveHaciendas = ({
    planter,
    setActiveTab,
}: {
    planter: PlanterWithRelations;
    setActiveTab: (tab: string) => void;
}) => {
    return (
        <div className="flex flex-col gap-4 rounded-md bg-white p-4 shadow-sm">
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
                    <HaciendaCard hacienda={hacienda} key={hacienda.id} />
                ))}
            </div>
        </div>
    );
};

export default ActiveHaciendas;
