import '@tanstack/react-table';

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData, TValue> {
        label?: string;
        filterOptions?: Array<{
            label: string;
            value: string | number | boolean;
        }>;
        color?: string;
    }
}
