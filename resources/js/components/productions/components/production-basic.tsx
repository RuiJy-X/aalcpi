import { ProductionRow } from '@/components/planters/planters-table-types';
import { Warehouse } from 'lucide-react';
import React from 'react';

const ProductionBasic = ({ productions }: { productions: ProductionRow }) => {
    const cards = [
        {
            label: 'Date',
            value: productions.production_date?.split('T')[0],
        },
        { label: 'Trans Code', value: productions.trans_code },
    ];
    return (
        <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-3 text-center text-2xl font-semibold tracking-tight text-[var(--dark)]">
                Basic Details
            </div>
            <div className="flex flex-grow flex-row gap-3">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="flex flex-1 flex-col gap-2 rounded-md border bg-white p-5"
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

export default ProductionBasic;
