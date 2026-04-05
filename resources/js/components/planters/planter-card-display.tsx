import React, { useState } from 'react'
import { router } from '@inertiajs/react';
import { create as createPage } from '@/routes/planters';
import { Container, ContainerHeader, ContainerHeaderEnd } from '../container'
import planters from '@/routes/planters'
import PlanterCard from './planter-view/planter-card'
import { PlanterRow } from './planters-table-types'
import { Input } from '../ui/input'
import { SearchInput } from '../ui/search-input'
import { Button } from '../ui/button'
import { User } from 'lucide-react'
import { ImportDialog } from '../import/import-dialog'
import { plantersImportConfig } from '../import/import-config'

const PlanterCardsDisplay = ({planters}: {planters:PlanterRow[]}) => {

    const [search, setSearch] = useState('');
    const filteredPlanters = planters.filter(planter =>
        planter.name.toLowerCase().includes(search.toLowerCase()) ||
        planter.planter_code.toLowerCase().includes(search.toLowerCase())
    );
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
                  <SearchInput
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                  />
              </ContainerHeaderEnd>
          </ContainerHeader>

          <div className="grid max-h-[600px] grid-cols-1 gap-3 overflow-y-auto p-3 md:grid-cols-1 xl:grid-cols-3">
              {filteredPlanters.map((planter) => (
                  <PlanterCard key={planter.id} planter={planter} />
              ))}
          </div>
      </Container>
  );
}

export default PlanterCardsDisplay