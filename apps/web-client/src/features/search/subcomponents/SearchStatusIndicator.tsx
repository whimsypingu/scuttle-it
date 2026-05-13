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
    console.log(firstActiveIndex);

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

const mockJobs: DownloadJob[] = [
    // Completed jobs
    {
        id: "550e8400-e29b-41d4-a716-446655440001",
        createdAt: Date.now() - 1000 * 60 * 15,
        status: "completed",
        query: "Daft Punk Get Lucky",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440002",
        createdAt: Date.now() - 1000 * 60 * 14,
        status: "completed",
        query: "Kendrick Lamar HUMBLE",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440003",
        createdAt: Date.now() - 1000 * 60 * 13,
        status: "completed",
        query: "Radiohead No Surprises",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440004",
        createdAt: Date.now() - 1000 * 60 * 12,
        status: "completed",
        query: "Tame Impala The Less I Know The Better",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440005",
        createdAt: Date.now() - 1000 * 60 * 11,
        status: "completed",
        query: "Frank Ocean Nights",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440006",
        createdAt: Date.now() - 1000 * 60 * 10,
        status: "completed",
        query: "Arctic Monkeys Do I Wanna Know",
    },

    // Processing jobs
    {
        id: "550e8400-e29b-41d4-a716-446655440007",
        createdAt: Date.now() - 1000 * 60 * 5,
        status: "processing",
        query: "Tyler The Creator EARFQUAKE",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440008",
        createdAt: Date.now() - 1000 * 60 * 4,
        status: "processing",
        query: "The Weeknd Blinding Lights",
    },

    // Pending jobs
    {
        id: "550e8400-e29b-41d4-a716-446655440009",
        createdAt: Date.now() - 1000 * 60 * 3,
        status: "pending",
        query: "Billie Eilish bad guy",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440010",
        createdAt: Date.now() - 1000 * 60 * 2.8,
        status: "pending",
        query: "Drake God's Plan",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440011",
        createdAt: Date.now() - 1000 * 60 * 2.6,
        status: "pending",
        query: "SZA Kill Bill",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440012",
        createdAt: Date.now() - 1000 * 60 * 2.4,
        status: "pending",
        query: "Post Malone Circles",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440013",
        createdAt: Date.now() - 1000 * 60 * 2.2,
        status: "pending",
        query: "Lana Del Rey Summertime Sadness",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440014",
        createdAt: Date.now() - 1000 * 60 * 2,
        status: "pending",
        query: "Joji Slow Dancing in the Dark",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440015",
        createdAt: Date.now() - 1000 * 60 * 1.8,
        status: "pending",
        query: "Childish Gambino Redbone",
    },
];