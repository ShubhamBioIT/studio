'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

type GetColumnsProps = {
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  currentUserUid?: string;
};

export const getColumns = ({ onEdit, onDelete, currentUserUid }: GetColumnsProps): ColumnDef<Project>[] => [
    {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              >
                Project Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>
    },
    {
        accessorKey: 'omics_type',
        header: 'Omics Type',
        cell: ({ row }) => <Badge variant="secondary">{row.getValue('omics_type')}</Badge>
    },
    {
        accessorKey: 'lead',
        header: 'Project Lead',
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
            const description = row.getValue('description') as string;
            if (!description) return <span className="text-muted-foreground">-</span>
            return <div className="max-w-xs truncate">{description}</div>
        },
        enableHiding: true,
    },
    {
        accessorKey: 'createdAt',
        header: 'Created Date',
        cell: ({ row }) => {
            const date = row.getValue('createdAt') as { toDate: () => Date };
            return date ? format(date.toDate(), 'PPP') : 'N/A';
        }
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const project = row.original;
            const isOwner = project.createdBy?.uid === currentUserUid;

            return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(project)} disabled={!isOwner}><Edit className="mr-2 h-4 w-4" /> Edit Project</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete(project)} disabled={!isOwner}><Trash2 className="mr-2 h-4 w-4" /> Delete Project</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            );
      },
    },
];
