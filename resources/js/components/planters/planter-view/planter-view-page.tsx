import React, { useState } from 'react';
import { PlanterWithRelations } from '../planters-table-types';
import PlanterCard from './planter-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, LandPlot, Pencil } from 'lucide-react';
import PlanterInfo from './planter-info';
import ActiveHaciendas from './haciendas/active-haciendas';
import { Button } from '@/components/ui/button';
import UpdatePlanterDialog from './update-planter-dialog';
import DisplayDate from '@/components/display-date';

const PlanterViewPage = ({
    planter,
    setActiveTab,
}: {
    planter: PlanterWithRelations;
    setActiveTab: (tab: string) => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);

    const totalHaciendaArea = planter.haciendas.reduce((total, hacienda) => {
        return total + Number(hacienda.area_hectares ?? 0);
    }, 0);

    const currentNetCW = planter.productions.reduce((total, production) => {
        return total + Number(production.net_cw ?? 0);
    }, 0);

    const cards = [
        {
            title: 'TOTAL HACIENDAS',
            value: planter.haciendas.length,
        },
        {
            title: 'TOTAL AREA (ha)',
            value: `${totalHaciendaArea.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })} `,
        },
        {
            title: 'CURRENT NET CW',
            value: `${currentNetCW.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })} `,
        },
    ];
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <div className="mb-2 border-green-900 py-2 text-3xl font-semibold tracking-tight text-[var(--dark)]">
                    Planter Details
                </div>
                <div className="flex gap-5">
                    <DisplayDate
                        label="Last Updated"
                        date={planter.updated_at?.split('T')[0] || 'N/A'}
                    />
                    <UpdatePlanterDialog
                        planter={planter}
                        setIsEditing={setIsEditing}
                    />
                </div>
            </div>
            <div className="flex-1">
                <PlanterCard planter={planter} />
            </div>
            <div className="flex flex-grow flex-row flex-wrap gap-4">
                {cards.map((card, index) => (
                    <Card
                        key={index}
                        className="flex-1 overflow-hidden bg-white shadow-lg"
                    >
                        <CardHeader>
                            <CardTitle className="font-regular text-sm tracking-wider text-gray-500">
                                {card.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative flex flex-col gap-2">
                                <div className="flex flex-row items-center justify-between text-4xl font-bold">
                                    {card.value}
                                    <LandPlot className="ml-5 inline text-green-200" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <PlanterInfo planter={planter} />
            <ActiveHaciendas planter={planter} setActiveTab={setActiveTab} />
        </div>
    );
};

export default PlanterViewPage;
