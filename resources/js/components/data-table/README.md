# Data table component (resources/js/components/data-table)

This README explains how the data-table component and its supporting column/filter files work, and how to extend them.

## Key files

- File: [resources/js/components/data-table/data-table.tsx](resources/js/components/data-table/data-table.tsx) : Main generic `DataTable` component built with `@tanstack/react-table`. Handles sorting, global & column filters, pagination, column visibility, row selection and rendering.
- File: [resources/js/components/data-table/data-table-column-filter.tsx](resources/js/components/data-table/data-table-column-filter.tsx) : `Filter` component used for per-column filters. Reads `column.columnDef.meta` for `label` and `filterOptions` and updates `columnFilters` state.
- File: [resources/js/components/data-table/planter-columns.tsx](resources/js/components/data-table/planter-columns.tsx) : Example ColumnDefs for planters (shows typical columns, select checkbox, actions cell).
- File: [resources/js/components/data-table/production-columns.tsx](resources/js/components/data-table/production-columns.tsx) : ColumnDefs for production rows (includes boolean filters and meta filterOptions).
- File: [resources/js/components/data-table/certification-columns.tsx](resources/js/components/data-table/certification-columns.tsx) : ColumnDefs for certifications, demonstrates custom `filterFn` and `meta.filterOptions`.
- File: [resources/js/components/data-table/land-columns.tsx](resources/js/components/data-table/land-columns.tsx) : ColumnDefs for lands, includes a `booleanStringFilter` helper and action buttons wired to Inertia routes.

## How `DataTable` works (high-level)

- **Generic props:** `DataTable<TData, TValue>` receives `columns: ColumnDef<TData, TValue>[]` and `data: TData[]`.
- **TanStack setup:** It uses `useReactTable` with core/pagination/sorting/filtering/visibility/row-selection plugins and exposes a `table` instance used throughout the UI.
- **State kept locally:** `sorting`, `columnFilters`, `globalFilter`, `pagination`, `columnVisibility`, `rowSelection`.
- **Global search:** Bound to `table.setGlobalFilter(...)`. The table config sets `globalFilterFn: 'includesString'`.

- **Column filters:** Per-column filters are stored in `columnFilters` and passed into the table state. `columnFilter` have a value of {id, value} where id is the column id like `status`, `name` and value is either a string or an array of strings. Ex. {id:'name', value:'Juan Luna'} or {id:'status', value: ['active','inactive']}. The `Filter` component writes to `columnFilters` via `setColumnFilters`.

- **Active filters UI:** `activeFilters` tracks which columns have visible filter controls; the UI toggles filter controls via the Filters dropdown checkbox items.
- **Column visibility:** Toggled in the Columns dropdown by calling `column.toggleVisibility(!!value)`.
- **Row selection & bulk actions:** Checkboxes use row selection APIs (`row.toggleSelected`, `table.toggleAllPageRowsSelected`). Bulk actions typically use `table.getFilteredSelectedRowModel().rows` to act only on filtered & selected rows.
- **Pagination:** Uses `getPaginationRowModel()` and `onPaginationChange` mapping to local `pagination` state.

## Filter component behavior

- `data-table-column-filter.tsx` inspects `column.columnDef.meta` for `label` and optional `filterOptions` (array of { label, value }).
- If `filterOptions` are present it renders a checkbox list (DropdownMenu) allowing multiple selection. Selected values are written as either `''` (for All) or an array of values.
- For free-text filters it renders a text `Input` which writes string values into `columnFilters`.
- The component expects `columnFilters` and `setColumnFilters` to be passed in and updates them with `id` and `value` entries matching TanStack's `ColumnFiltersState`.

## Column metadata and custom filtering

- To enable rich filter UI, add `meta` to a column's definition:

    meta: {
    label: 'Status',
    filterOptions: [ { label: 'All', value: '' }, { label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' } ]
    }

- If the default filter behavior doesn't fit, provide `filterFn` on the column. Example boolean-string comparisons are implemented in `land-columns.tsx` and `production-columns.tsx`

## Actions column pattern

- Columns with `id: 'actions'` render buttons (Preview/Edit/Delete) and usually stop event propagation on click to prevent row navigation. Edit/preview often use Inertia `router.get(...)` to navigate.

## Adding a new table usage

1. Create a row type, e.g. `type MyRow = { id: string; name: string; ... }`.
2. Create `const myColumns: ColumnDef<MyRow>[] = [ ... ]`. Use `accessorKey` for simple access or `cell` renderers for custom UI.
3. Export a data-fetching method from your page and pass `data` (array) to the table.
4. Render the table:

```tsx
import { DataTable } from '@/components/data-table/data-table';
import { myColumns } from '@/components/data-table/my-columns';

<DataTable columns={myColumns} data={myData} />;
```

## Tips & gotchas

- Keep `meta.filterOptions` values consistent with your `filterFn` types (string vs boolean). Many columns stringify boolean values (`'true'`/`'false'`) for compatibility with `Filter`.
- The `Select All` checkbox uses page-scoped selection APIs (`toggleAllPageRowsSelected`) so bulk actions can be performed on just the current page or using filtered-selection helpers.
- When adding heavy custom cell renderers, ensure cells have predictable widths or the table's `getTotalSize()` may layout unexpectedly.

## Where to look for examples in this repo

- File: [resources/js/components/data-table/planter-columns.tsx](resources/js/components/data-table/planter-columns.tsx)
- File: [resources/js/components/data-table/production-columns.tsx](resources/js/components/data-table/production-columns.tsx)
- File: [resources/js/components/data-table/certification-columns.tsx](resources/js/components/data-table/certification-columns.tsx)
- File: [resources/js/components/data-table/land-columns.tsx](resources/js/components/data-table/land-columns.tsx)

## Next steps (optional)

- Add a small example page that imports one of the columns sets and mounts `DataTable` with mock data.
- Add unit tests for `Filter` behavior (selected values -> columnFilters updates).

If you want, I can also add a small example page and a test scaffold next.
