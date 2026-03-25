import React from 'react';
import { ProductionRow } from '../planters-table-types';
import { Container, ContainerHeader } from '@/components/container';
import { DataTable } from '@/components/data-table/data-table';
import { productionColumns } from '@/components/data-table/production-columns';
import { productionBulkDelete } from '@/components/data-table/bulk-delete';
import { show as productionShow } from '@/routes/productions';
const PlanterViewProductions = ({
    productions,
}: {
    productions: ProductionRow[];
}) => {
    return (
        <div>
            <div>
                <div className="mb-2 border-green-900 py-2 text-3xl font-semibold tracking-tight text-[var(--dark)]">
                    Productions
                </div>
            </div>
            <Container>
                <ContainerHeader>Productions Table</ContainerHeader>
                <DataTable
                    columns={productionColumns}
                    data={productions}
                    bulkDelete={productionBulkDelete}
                    onRowDoubleClick={(production) =>
                        productionShow(production.id).url
                    }
                />
            </Container>
        </div>
    );
};

export default PlanterViewProductions;
