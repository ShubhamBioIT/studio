'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Edit, Trash2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Workflow } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import Link from 'next/link';

type WorkflowStatus = 'Draft' | 'Active' | 'Archived';

const statusVariant: Record<WorkflowStatus, 'default' | 'secondary' | 'outline'> = {
    Draft: 'outline',
    Active: 'default',
    Archived: 'secondary',
}

type GetColumnsProps = {
  onEdit: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
  currentUserUid?: string;
};


export const getColumns = ({ onEdit, onDelete, currentUserUid }: GetColumnsProps): ColumnDef<Workflow>[] => [
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
                Workflow Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>
    },
    {
        accessorKey: 'pipeline_type',
        header: 'Pipeline Type',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as WorkflowStatus;
            return <Badge variant={statusVariant[status]}>{status}</Badge>
        }
    },
    {
        accessorKey: 'protocol_link',
        header: 'Protocol',
        cell: ({ row }) => {
            const link = row.getValue('protocol_link') as string;
            if (!link) return <span className="text-muted-foreground">-</span>
            return (
                <Button variant="ghost" size="icon" asChild>
                    <Link href={link} target="_blank">
                        <LinkIcon className="h-4 w-4" />
                    </Link>
                </Button>
            )
        }
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
            const workflow = row.original;
            const isOwner = workflow.createdBy?.uid === currentUserUid;

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
                    <DropdownMenuItem onClick={() => onEdit(workflow)} disabled={!isOwner}><Edit className="mr-2 h-4 w-4" /> Edit Workflow</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete(workflow)} disabled={!isOwner}><Trash2 className="mr-2 h-4 w-4" /> Delete Workflow</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            );
      },
    },
];
