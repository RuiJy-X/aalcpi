import type { ProductionRow } from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const ProductionInfo = ({ production }: { production: ProductionRow }) => {
    const details = [
        { label: 'Planter ID', value: production.planter_id },
        { label: 'Land ID', value: production.land_id },
        { label: 'Year', value: production.production_year },
        { label: 'Month', value: production.production_month },
        { label: 'Gross CW', value: production.gross_cw },
        { label: 'Net CW', value: production.net_cw },
        { label: 'Trucks', value: production.trucks },
        { label: 'Theoretical LKG', value: production.theoretical_lkg },
        { label: 'Actual LKG', value: production.actual_lkg },
        { label: 'PSHR Net LKG', value: production.pshr_net_lkg },
        { label: 'PDPA LKG', value: production.pdpa_lkg },
        {
            label: 'Association Dues LKG',
            value: production.association_dues_lkg,
        },
        { label: 'Actual MOL', value: production.actual_mol },
        { label: 'PSHR Net MOL', value: production.pshr_net_mol },
        { label: 'PDPA MOL', value: production.pdpa_mol },
        {
            label: 'Association Dues MOL',
            value: production.association_dues_mol,
        },
        { label: 'Trans Code', value: production.trans_code ?? 'N/A' },
        {
            label: 'Transloading',
            value: production.transloading ? 'Yes' : 'No',
        },
    ];
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Production Details</CardTitle>
                <Button className="max-w-3xs">Edit Production</Button>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-row flex-wrap gap-4">
                        {details.slice(0, 4).map((detail) => (
                            <Field
                                key={detail.label}
                                className="w-full md:w-[calc(50%-0.5rem)]"
                            >
                                <FieldLabel>{detail.label}</FieldLabel>
                                <Input
                                    placeholder={detail.label}
                                    value={String(detail.value)}
                                    readOnly
                                />
                            </Field>
                        ))}
                    </div>
                    <div className="flex flex-row flex-wrap gap-4">
                        {details.slice(4, 10).map((detail) => (
                            <Field
                                key={detail.label}
                                className="w-full md:w-[calc(33.333%-0.5rem)]"
                            >
                                <FieldLabel>{detail.label}</FieldLabel>
                                <Input
                                    placeholder={detail.label}
                                    value={String(detail.value)}
                                    readOnly
                                />
                            </Field>
                        ))}
                    </div>
                    <div className="flex flex-row flex-wrap gap-4">
                        {details.slice(10, 16).map((detail) => (
                            <Field
                                key={detail.label}
                                className="w-full md:w-[calc(33.333%-0.5rem)]"
                            >
                                <FieldLabel>{detail.label}</FieldLabel>
                                <Input
                                    placeholder={detail.label}
                                    value={String(detail.value)}
                                    readOnly
                                />
                            </Field>
                        ))}
                    </div>
                    <div className="flex flex-row flex-wrap gap-4">
                        {details.slice(16).map((detail) => (
                            <Field
                                key={detail.label}
                                className="w-full md:w-[calc(50%-0.5rem)]"
                            >
                                <FieldLabel>{detail.label}</FieldLabel>
                                <Input
                                    placeholder={detail.label}
                                    value={String(detail.value)}
                                    readOnly
                                />
                            </Field>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductionInfo;
