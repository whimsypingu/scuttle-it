import { CaretCircleRightIcon, CheckCircleIcon, DotsThreeCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import type { JobStatus, JobStatusConfig } from './job.types';


//all available job statuses with their corresponding icons and colors
export const JOB_STATUS_CONFIG: Record<JobStatus, JobStatusConfig> = {
    completed: {
        icon: CheckCircleIcon,
        color: "currentColor"
    },
    failed: {
        icon: XCircleIcon,
        color: "currentColor"
    },
    processing: {
        icon: CaretCircleRightIcon,
        color: "var(--color-brand)"
    },
    pending: {
        icon: DotsThreeCircleIcon,
        color: "currentColor"
    }
};