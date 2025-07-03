'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Download, Edit, Trash2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import type { Sample, SampleStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import Link from 'next/link';

const statusVariant: Record<SampleStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    'in-progress': 'default',
    completed: 'secondary',
    failed: 'destructive',
}

const statusColor: Record<SampleStatus, string> = {
    pending: 'border-yellow-500 text-yellow-500',
    'in-progress': 'bg-blue-500 text-white',
    completed: 'bg-green-500 text-white',
    failed: 'bg-destructive text-destructive-foreground',
}

type GetColumnsProps = {
  onEdit: (sample: Sample) => void;
  onDelete: (sample: Sample) => void;
  currentUserUid?: string;
};


export const getColumns = ({ onEdit, onDelete, currentUserUid }: GetColumnsProps): ColumnDef<Sample>[] => [
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
        accessorKey: 'sample_id',
        header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              >
                Sample ID
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('sample_id')}</div>
    },
    {
        accessorKey: 'project_name',
        header: 'Project',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as SampleStatus;
            const formattedStatus = status.replace('-', ' ');
            return <Badge variant={statusVariant[status]} className={statusColor[status]}>{formattedStatus}</Badge>
        }
    },
    {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }) => {
            const tags = row.original.tags;
            if (!tags || tags.length === 0) return <div className="text-muted-foreground">-</div>;
            return (
                <div className="flex flex-wrap gap-1 max-w-xs">
                    {tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
            )
        },
        enableHiding: true,
    },
    {
        accessorKey: 'tissue_type',
        header: 'Tissue Type',
        enableHiding: true,
    },
    {
        accessorKey: 'extraction_method',
        header: 'Extraction Method',
        enableHiding: true,
    },
    {
        accessorKey: 'storage_condition',
        header: 'Storage Condition',
        enableHiding: true,
    },
    {
        accessorKey: 'date_collected',
        header: 'Date Collected',
        cell: ({ row }) => {
            const date = row.getValue('date_collected') as { toDate: () => Date };
            return date ? format(date.toDate(), 'PPP') : 'N/A';
        }
    },
    {
        accessorKey: 'collected_by',
        header: 'Collected By',
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const sample = row.original;
            const hasAttachments = sample.attachments && sample.attachments.length > 0;
            const isOwner = sample.createdBy?.uid === currentUserUid;

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
                    <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(sample.id)}
                    >
                        Copy Firestore ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(sample)} disabled={!isOwner}><Edit className="mr-2 h-4 w-4" /> Edit Sample</DropdownMenuItem>
                    
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger disabled={!hasAttachments}>
                            <FileDown className="mr-2 h-4 w-4" /> Download Files
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                {hasAttachments && sample.attachments.map(att => (
                                    <DropdownMenuItem key={att.url} asChild>
                                        <Link href={att.url} target="_blank" download={att.name}>{att.name}</Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete(sample)} disabled={!isOwner}><Trash2 className="mr-2 h-4 w-4" /> Delete Sample</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            );
      },
    },
];
