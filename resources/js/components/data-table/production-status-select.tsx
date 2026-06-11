'use client';

import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import type { ProductionRow } from '@/components/planters/planters-table-types';

interface ProductionStatusSelectProps {
    production: ProductionRow;
}

export default function ProductionStatusSelect({
    production,
}: ProductionStatusSelectProps) {
    const [status, setStatus] = useState(production.status);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setStatus(production.status);
    }, [production.id, production.status]);

    const handleStatusChange = (newStatus: string) => {
        const previousStatus = status;
        setStatus(newStatus);
        setError(null);

        router.patch(
            `/Productions/view/${production.id}/status`,
            { status: newStatus },
            {
                onError: () => {
                    setStatus(previousStatus);
                    setError('Failed to update status');
                },
            }
        );
    };

    return (
        <div className="flex items-center">
            <div className="ml-2 truncate">
                <Select
                    value={status}
                    onValueChange={handleStatusChange}
                >
                    <SelectTrigger
                        className={`w-[180px] ${
                            error ? 'border-red-500' : ''
                        }`}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="completed">
                                Completed
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                {error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
            </div>
        </div>
    );
}
