import type { DownloadJob, JobBase } from "./job.types";

export function isDownloadJob(job: JobBase): job is DownloadJob {
    return "query" in job || "trackId" in job;
}