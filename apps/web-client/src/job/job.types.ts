export type JobStatus = "Pending" | "Processing" | "Error";

export interface JobBase {
    id: string;
    date: number;
    tag: string;
    status: JobStatus;
}
