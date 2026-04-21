import React from 'react';
import { ProductionRow } from '../planters/planters-table-types';
import { MapPin } from 'lucide-react';

const ProductionCard = ({ production }: { production: ProductionRow }) => {
    const {
        id,
        planter_code,
        planter_name,
        hacienda_code,
        hacienda_name,
        hacienda_address,
        production_year,
        production_month,
        gross_cw,
        net_cw,
        trucks,
        theoretical_lkg,
        actual_lkg,
        pshr_net_lkg,
        pdpa_lkg,
        association_dues_lkg,
        actual_mol,
        pshr_net_mol,
        pdpa_mol,
        association_dues_mol,
        trans_code,
        transloading,
    } = production;
    return (
        <div className="bg-surface-container-lowest border-outline-variant/10 flex min-h-[180px] overflow-hidden rounded-xl border shadow-sm">
            <div className="bg-surface-container-low border-outline-variant/20 relative flex w-56 flex-col justify-between border-r-2 border-dashed p-6">
                <div>
                    <div className="text-primary-container mb-1 text-[10px] font-bold tracking-tighter uppercase">
                        Transaction Code
                    </div>
                    <div className="text-on-surface text-lg font-black tracking-tight">
                        {trans_code}
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex items-end justify-between">
                        <span className="text-on-surface-variant text-xs font-medium">
                            Year/Month
                        </span>
                        <span className="text-on-surface truncate text-xs font-bold tracking-tight">
                            {production_year} / {production_month}
                        </span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-on-surface-variant text-xs font-medium">
                            Truck Count
                        </span>
                        <span className="text-on-surface text-sm font-bold">
                            {trucks}
                        </span>
                    </div>
                </div>
                <div className="bg-surface absolute -top-3 -right-3 h-6 w-6 rounded-full"></div>
                <div className="bg-surface absolute -right-3 -bottom-3 h-6 w-6 rounded-full"></div>
            </div>
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-on-surface text-lg leading-tight font-bold">
                            {planter_name}
                        </h3>
                        <p className="text-on-surface-variant flex items-center gap-1 text-xs">
                            <MapPin
                                size={12}
                                className="text-on-surface-variant"
                            />

                            {hacienda_address}
                        </p>
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
                        Pending Final Audit
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-8">
                    <div className="col-span-1">
                        <span className="text-on-surface-variant mb-1 block text-[10px] font-black uppercase opacity-50">
                            Net CW
                        </span>
                        <span className="text-2xl font-black text-primary">
                            {Number(net_cw).toFixed(2)}
                        </span>
                    </div>
                    <div className="col-span-1">
                        <span className="text-on-surface-variant mb-1 block text-[10px] font-black uppercase opacity-50">
                            Total Actual LKG
                        </span>
                        <span className="text-on-surface text-2xl font-black">
                            {Number(actual_lkg).toFixed(2)}
                        </span>
                    </div>
                    <div className="border-outline-variant/20 col-span-1 border-l pl-6">
                        <span className="text-on-surface-variant mb-2 block text-[10px] font-black uppercase opacity-50">
                            Deductions
                        </span>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                                <span className="text-on-surface-variant">
                                    PSHR Net LKG
                                </span>
                                <span className="font-bold">
                                    {Number(pshr_net_lkg)}
                                </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-on-surface-variant">
                                    PDPA LKG
                                </span>
                                <span className="font-bold">
                                    {Number(pdpa_lkg)}
                                </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-on-surface-variant">
                                    Assoc Dues
                                </span>
                                <span className="text-tertiary font-bold">
                                    {Number(association_dues_lkg)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="border-outline-variant/20 col-span-1 border-l pl-6">
                        <span className="text-on-surface-variant mb-2 block text-[10px] font-black uppercase opacity-50">
                            MOL Metrics
                        </span>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                                <span className="text-on-surface-variant">
                                    Actual MOL
                                </span>
                                <span className="font-bold">
                                    {Number(actual_mol)}
                                </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-on-surface-variant">
                                    PSHR Net MOL
                                </span>
                                <span className="font-bold">
                                    {Number(pshr_net_mol)}
                                </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-on-surface-variant">
                                    PDPA MOL
                                </span>
                                <span className="font-bold">
                                    {Number(pdpa_mol)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionCard;
