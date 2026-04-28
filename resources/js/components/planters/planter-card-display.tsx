import React from 'react';
import { router } from '@inertiajs/react';
import { create as createPage } from '@/routes/planters';
import { Container, ContainerHeader, ContainerHeaderEnd } from '../container';
import PlanterCard from './planter-view/planter-card';
import { PlanterRow } from './planters-table-types';
import { Button } from '../ui/button';
import { User } from 'lucide-react';
import { ImportDialog } from '../import/import-dialog';
import { plantersImportConfig } from '../import/import-config';

const PlanterCardsDisplay = ({ planters }: { planters: PlanterRow[] }) => {
    return (
        <Container>
            <ContainerHeader>
                Planters
                <ContainerHeaderEnd>
                    <ContainerHeaderEnd>
                        <ImportDialog config={plantersImportConfig} />
                        <Button
                            variant="outline"
                            onClick={() => router.get(createPage().url)}
                        >
                            <User />
                            Register Planter
                        </Button>
                    </ContainerHeaderEnd>
                </ContainerHeaderEnd>
            </ContainerHeader>

            <div className="grid max-h-[600px] grid-cols-1 gap-3 overflow-y-auto p-3 md:grid-cols-1 xl:grid-cols-3">
                {planters.map((planter) => (
                    <PlanterCard key={planter.id} planter={planter} />
                ))}
            </div>
        </Container>
    );
};

export default PlanterCardsDisplay;
