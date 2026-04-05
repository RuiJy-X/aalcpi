import React from 'react';
import { HaciendaRow } from '../planters-table-types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { DataTable } from '@/components/data-table/data-table';
import { haciendaBulkDelete } from '@/components/data-table/bulk-delete';
import { haciendaColumns } from '@/components/data-table/hacienda-columns';
import { show as haciendaShow } from '@/routes/haciendas';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { router } from '@inertiajs/react';
import { create as createHacienda } from '@/routes/haciendas';

const PlanterViewHaciendas = ({ haciendas }: { haciendas: HaciendaRow[] }) => {
    return (
        <div>
            <div>
                <div className="mb-2 border-green-900 py-2 text-3xl font-semibold tracking-tight text-[var(--dark)]">
                    Haciendas
                </div>
            </div>
            <Container>
                <ContainerHeader>
                    Haciendas Table
                    <ContainerHeaderEnd>
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.get(
                                    createHacienda(haciendas[0]?.planter_id)
                                        .url,
                                )
                            }
                        >
                            <i>
                                <Plus />
                            </i>
                            Add Hacienda
                        </Button>
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    data={haciendas}
                    columns={haciendaColumns}
                    bulkDelete={haciendaBulkDelete}
                    onRowDoubleClick={(hacienda) =>
                        haciendaShow(hacienda.id).url
                    }
                />
            </Container>
        </div>
    );
};

export default PlanterViewHaciendas;
