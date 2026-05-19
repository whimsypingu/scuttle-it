import { useDownloadJobs } from "@/store/hooks/useJobs";
import { ChecksIcon } from "@phosphor-icons/react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { JobItem } from "@/job/JobItem";

import type { DownloadJob } from "@/job/job.types";


export const SearchStatusIndicator = () => {

    // status of search and download jobs
    const { jobs, isPending, isProcessing } = useDownloadJobs();

    const firstActiveIndex = jobs.findIndex(job => job.status !== "completed");
    //console.log(firstActiveIndex); //DEBUG

    const activeItemRef = (node: HTMLDivElement | null) => {
        if (node) {
            requestAnimationFrame(() => {
                node.scrollIntoView({
                    block: "start",
                    behavior: "auto",
                });
            });
        }
    };

    return (
        <>
        {/* DOWNLOAD INDICATOR */}
        {(jobs.length > 0) && (
            <Popover>
                <PopoverTrigger asChild>
                    <button 
                        className="p-2"
                        onClick={(e) => {
                            e.stopPropagation(); //prevent closing the search results
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        {(isPending || isProcessing) ? (
                            <Spinner className="size-4" />
                        ) : (
                            <ChecksIcon />
                        )}
                    </button>
                </PopoverTrigger>

                <PopoverContent align="start" className="max-h-[30dvh] max-w-[60dvw] p-0">
                    <div className="overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col gap-1">
                            {jobs.map((job, index) => (
                                <div
                                    key={job.id} 
                                    ref={index === firstActiveIndex ? activeItemRef : null}
                                >
                                    <JobItem job={job} />
                                </div>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        )}
        </>
    )
}
