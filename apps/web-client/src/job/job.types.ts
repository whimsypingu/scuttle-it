import type { IconProps } from "@phosphor-icons/react";


export type JobStatus = "pending" | "processing" | "completed" | "failed"; //see: apps/audio-server/core/models/jobs.py

export interface JobStatusConfig { //corresponding phosphor icon and color pairing to show per JobStatus
    icon: React.ComponentType<IconProps>;
    color: string;
}

export interface JobBase {
    id: string;
    createdAt: number;
    status: JobStatus;
}

export interface DownloadJob extends JobBase {
    trackId?: string;
    query?: string;
}


export interface JobItemProps {
    job: JobBase;
}

