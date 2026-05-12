export type JobStatus = "pending" | "processing" | "completed" | "failed"; //see: apps/audio-server/core/models/jobs.py

export interface JobBase {
    id: string;
    createdAt: number;
    status: JobStatus;
}

export interface DownloadJob extends JobBase {
    trackId?: string;
    query?: string;
}
