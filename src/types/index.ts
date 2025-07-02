import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'technician' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: Timestamp;
}

export type SampleStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Sample {
  id: string;
  sample_id: string;
  project_name: string;
  collected_by: string;
  date_collected: Timestamp;
  status: SampleStatus;
  description?: string;
  attachments: Attachment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: {
    uid: string;
    name: string | null;
  };
  // New advanced fields
  tissue_type?: string;
  extraction_method?: string;
  storage_condition?: string;
  tags?: string[];
  external_db_link?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  omics_type: 'Genomics' | 'Transcriptomics' | 'Proteomics' | 'Multi-omics';
  lead: string;
  collaborators?: string[];
  sample_ids?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: {
    uid: string;
    name: string | null;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  pipeline_type: 'RNA-seq' | 'Variant Calling' | 'CRISPR Screening' | 'Other';
  status: 'Draft' | 'Active' | 'Archived';
  protocol_link?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: {
    uid: string;
    name: string | null;
  };
}
