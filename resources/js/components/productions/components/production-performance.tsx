import { ProductionRow } from '@/components/planters/planters-table-types';
import { ChartBarIncreasing, Warehouse } from 'lucide-react';
import React from 'react';

const ProductionPerformance = ({
    productions,
}: {
    productions: ProductionRow;
}) => {
    const cards = [
        { label: 'Theoretical LKG', value: productions.theoretical_lkg },
        { label: 'Actual LKG', value: productions.actual_lkg },
    ];
    return (
        <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-3 text-center text-2xl font-semibold tracking-tight text-[var(--dark)]">
                <ChartBarIncreasing />
                Production Performance
            </div>
            <div className="flex flex-grow flex-row gap-3">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="flex flex-1 flex-col gap-2 rounded-md border bg-white p-5 shadow-sm"
                    >
                        <div className="text-sm font-medium text-gray-500">
                            {card.label}
                        </div>
                        <div className="text-xl font-semibold text-[var(--dark)]">
                            {card.value ?? 'N/A'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductionPerformance;
