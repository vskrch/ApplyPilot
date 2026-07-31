import { clsx } from "@/lib/utils";

interface DataTableProps<T> {
  columns: {
    header: string;
    key: keyof T | ((item: T) => React.ReactNode);
    className?: string;
  }[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {columns.map((col, i) => (
              <th
                key={i}
                className={clsx(
                  "table-header text-left py-3 px-4",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIdx) => (
            <tr
              key={rowIdx}
              className={clsx(
                "table-row",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={clsx("py-3 px-4 text-[var(--text-secondary)]", col.className)}
                >
                  {typeof col.key === "function"
                    ? col.key(item)
                    : String(item[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
