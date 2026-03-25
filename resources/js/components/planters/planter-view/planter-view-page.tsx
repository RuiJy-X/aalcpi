import React from 'react';
import { PlanterWithRelations } from '../planters-table-types';
import PlanterCard from './planter-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LandPlot } from 'lucide-react';
import PlanterInfo from './planter-info';
import ActiveHaciendas from './active-haciendas';

const PlanterViewPage = ({
    planter,
    setActiveTab,
}: {
    planter: PlanterWithRelations;
    setActiveTab: (tab: string) => void;
}) => {
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
            <div>
                <div className="mb-2 border-green-900 py-2 text-3xl font-semibold tracking-tight text-[var(--dark)]">
                    Planter Details
                </div>
            </div>
            <div className="flex flex-row flex-wrap gap-4">
                <div>
                    <PlanterCard planter={planter} />
                </div>
                {cards.map((card, index) => (
                    <Card
                        key={index}
                        className="overflow-hidden bg-gradient-to-br from-green-100 to-white"
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
