'use client'

import * as React from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  className?: string
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  pageSize?: number
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
  pageSize = 20,
  emptyMessage = 'No hay registros',
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(1)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const sliced = data.slice((page - 1) * pageSize, page * pageSize)
  const showActions = onEdit || onDelete

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
        Cargando...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>{col.header}</TableHead>
            ))}
            {showActions && <TableHead className="w-24 text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sliced.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (showActions ? 1 : 0)}
                className="text-center text-slate-400 py-12"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sliced.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render(row)}
                  </TableCell>
                ))}
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(row)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(row)}
                          title="Eliminar"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.length)} de {data.length}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
