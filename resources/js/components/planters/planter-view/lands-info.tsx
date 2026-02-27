import { DataTable } from '@/components/data-table/data-table';
import { landColumns } from '@/components/data-table/land-columns';
import type { LandRow } from '@/components/planters/planters-table-types';

type LandsInfoProps = {
    lands: LandRow[];
};

const LandsInfo = ({ lands }: LandsInfoProps) => {
    return <DataTable columns={landColumns} data={lands} />;
};

export default LandsInfo;
