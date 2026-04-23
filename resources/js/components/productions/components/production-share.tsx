import { ProductionRow } from '@/components/planters/planters-table-types';
import { Banknote, Warehouse } from 'lucide-react';
import React from 'react';

const ProductionShare = ({ productions }: { productions: ProductionRow }) => {
    const lkg = [
        { label: 'Planter Share Net LKG', value: productions.pshr_net_lkg },
        { label: 'PDPA LKG', value: productions.pdpa_lkg },
        {
            label: 'Association Dues LKG',
            value: productions.association_dues_lkg,
        },
    ];

    const mol = [
        { label: 'Planter Share Net MOL', value: productions.pshr_net_mol },
        { label: 'PDPA MOL', value: productions.pdpa_mol },
        {
            label: 'Association Dues MOL',
            value: productions.association_dues_mol,
        },
    ];
    return (
        <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-3 text-center text-2xl font-semibold tracking-tight text-[var(--dark)]">
                <Banknote />
                Financial Metrics
            </div>
            <div className="flex gap-5">
                <div className="flex flex-grow flex-col gap-3 rounded-md bg-emerald-50 p-5">
                    <div>
                        <div className="text-dark text-sm font-medium">
                            LKG Distributions
                        </div>
                    </div>
                    {lkg.map((card) => (
                        <div
                            key={card.label}
                            className="inline-flex flex-grow items-center gap-2 rounded-md border bg-white p-5 shadow-sm"
                        >
                            <div className="text-md flex-1 font-medium text-gray-500">
                                {card.label}
                            </div>
                            <div
                                className={`text-xl font-semibold text-[var(--dark)] ${card.label === 'PDPA LKG' || card.label === 'Association Dues LKG' ? 'text-red-500' : ''}`}
                            >
                                {card.value ?? 'N/A'}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-grow flex-col gap-3 rounded-md bg-emerald-50 p-5">
                    <div>
                        <div className="text-dark text-sm font-medium">
                            MOL Distributions
                        </div>
                    </div>
                    {mol.map((card) => (
                        <div
                            key={card.label}
                            className="inline-flex flex-grow items-center gap-2 rounded-md border bg-white p-5 shadow-sm"
                        >
                            <div className="text-md flex-1 font-medium text-gray-500">
                                {card.label}
                            </div>
                            <div
                                className={`text-xl font-semibold text-[var(--dark)] ${card.label === 'PDPA MOL' || card.label === 'Association Dues MOL' ? 'text-red-500' : ''} `}
                            >
                                {card.value ?? 'N/A'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductionShare;
