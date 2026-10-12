import React from 'react';
import { Loader2 } from 'lucide-react';

interface TableProps {
  columns: { header: string; accessorKey?: string; cell?: (row: any) => React.ReactNode }[];
  data: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  stickyHeader?: boolean;
}

export function Table({ columns, data, isLoading, emptyMessage = 'No data available', stickyHeader = true }: TableProps) {
  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className={`${stickyHeader ? 'sticky top-0 z-10' : ''} bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 text-slate-500 font-medium text-xs tracking-wide`}>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3.5 whitespace-nowrap">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {isLoading ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center"><Loader2 className="animate-spin inline" /></td></tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-3">
                      {col.cell ? col.cell(row) : col.accessorKey ? row[col.accessorKey] : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
