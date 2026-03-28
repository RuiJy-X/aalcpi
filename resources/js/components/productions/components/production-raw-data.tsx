import { ProductionRow } from '@/components/planters/planters-table-types';
import { Warehouse } from 'lucide-react';
import React from 'react';

const ProductionRawData = ({ productions }: { productions: ProductionRow }) => {
    const cards = [
        { label: 'Gross CW', value: productions.gross_cw },
        { label: 'Net CW', value: productions.net_cw },
        { label: 'Trucks', value: productions.trucks },
    ];
    return (
        <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-3 text-center text-2xl font-semibold tracking-tight text-[var(--dark)]">
                <Warehouse />
                Raw Materials and Logistics
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

export default ProductionRawData;
