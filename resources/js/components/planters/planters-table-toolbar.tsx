import type { OwnershipType } from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type StatusFilter = 'all' | 'active' | 'inactive';

type Props = {
    query: string;
    onQueryChange: (next: string) => void;

    statusFilter: StatusFilter;
    onStatusFilterChange: (next: StatusFilter) => void;

    ownershipFilter: 'all' | OwnershipType;
    onOwnershipFilterChange: (next: 'all' | OwnershipType) => void;

    selectedCount: number;
    onBulkDelete: () => void;
};

export function PlantersTableToolbar({
    query,
    onQueryChange,
    statusFilter,
    onStatusFilterChange,
    ownershipFilter,
    onOwnershipFilterChange,
    selectedCount,
    onBulkDelete,
}: Props) {
    const bulkDeleteDisabled = selectedCount === 0;

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-72">
                <SearchInput
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Search"
                />
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
                <div className="w-full sm:w-40">
                    <Select
                        value={statusFilter}
                        onValueChange={(v) =>
                            onStatusFilterChange(v as StatusFilter)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full sm:w-44">
                    <Select
                        value={ownershipFilter}
                        onValueChange={(v) =>
                            onOwnershipFilterChange(v as 'all' | OwnershipType)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Ownership" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Owned">Owned</SelectItem>
                            <SelectItem value="Leased">Leased</SelectItem>
                            <SelectItem value="Tenant">Tenant</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant="destructive"
                    disabled={bulkDeleteDisabled}
                    onClick={onBulkDelete}
                >
                    Delete {selectedCount > 0 ? `(${selectedCount})` : ''}
                </Button>
            </div>
        </div>
    );
}
