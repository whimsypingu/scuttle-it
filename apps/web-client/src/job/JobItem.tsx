import { isDownloadJob } from '@/job/job.utils';

import { JOB_STATUS_CONFIG } from '@/job/job.constants';

import type { JobItemProps } from '@/job/job.types';


export const JobItem = ({ 
    job,
}: JobItemProps) => {

    //extract the right Icon and color based on job status
    const config = JOB_STATUS_CONFIG[job.status];
    const IconComponent = config.icon;
    const color = config.color;
    
    let displayText = job.id;
    if (isDownloadJob(job)) { //typecasts to DownloadJob if it has the required fields
        displayText = job.query || job.trackId || job.id;
    }

    const getTimeAgo = (secs: number) => {
        const seconds = Math.floor(((Date.now() / 1000) - secs));
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    return (
        <>
        <div 
            key={job.id}
            className="w-full flex items-center gap-2 p-2"
        >
            <div 
                className="flex-shrink-0 p-1"
                style={{ color }}
            >
                <IconComponent size={14} weight="fill" />
            </div>

            {/* JOB DETAILS */}
            <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                <span className="text-xs font-medium text-white/90 break-words block">
                    {displayText}
                </span>

                <span className="text-[10px] text-white/20 pt-[2px] truncate block">
                    Started: {getTimeAgo(job.createdAt)}
                </span>
            </div>
        </div>
        </>
    );
};