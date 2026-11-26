import type { ReactNode } from 'react'

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
}

interface DataTableProps<T> {
  caption: string
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => number
  actions?: (row: T) => ReactNode
}

// A table on wide screens; stacked records on narrow ones
export function DataTable<T>({ caption, columns, rows, rowKey, actions }: DataTableProps<T>) {
  const [primary, ...details] = columns

  return (
    <div className="overflow-hidden rounded-panel border border-line bg-surface">
      <table className="hidden w-full text-left text-sm md:table">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line bg-surface-alt text-xs text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col" className="px-4 py-2.5 font-medium">
                {column.header}
              </th>
            ))}
            {actions && (
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-surface-alt/50">
              {columns.map((column) => (
                <td key={column.header} className="wrap-text px-4 py-3 align-middle">
                  {column.cell(row)}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">{actions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <ul aria-label={caption} className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="grid gap-2 p-4 text-sm">
            {primary && <div className="wrap-text">{primary.cell(row)}</div>}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {details.map((column) => (
                <div key={column.header} className="contents">
                  <dt className="text-muted">{column.header}</dt>
                  <dd className="wrap-text">{column.cell(row)}</dd>
                </div>
              ))}
            </dl>
            {actions && <div className="flex flex-wrap gap-2 pt-1">{actions(row)}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}
