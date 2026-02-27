import type { PlanterRow } from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const PersonalInfo = ({ planter }: { planter: PlanterRow }) => {
    const createdAt = planter.created_at?.split('T')[0] ?? 'N/A';
    const updatedAt = planter.updated_at?.split('T')[0] ?? 'N/A';

    const details = [
        { label: 'Planter Code', value: planter.planter_code },
        { label: 'Name', value: planter.name },
        { label: 'Address', value: planter.address },
        { label: 'TIN Number', value: planter.tin_number },
        { label: 'Contact Number', value: planter.contact_number },
        { label: 'Registration Date', value: planter.registration_date },
        { label: 'Created At', value: createdAt },
        { label: 'Updated At', value: updatedAt },
    ];
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Planter Details</CardTitle>
                <Button className="max-w-3xs">Edit Planter</Button>
            </CardHeader>
            <CardContent>
                {details.map((detail) => (
                    <Field className="mt-3">
                        <FieldLabel>{detail.label}</FieldLabel>
                        <Input
                            placeholder={detail.label}
                            value={detail.value}
                            readOnly
                        />
                    </Field>
                ))}
            </CardContent>
        </Card>
    );
};

export default PersonalInfo;
