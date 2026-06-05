export interface ProfileTabProps {
    tabResetSignal: number;
}

/**
 * useProfile
 */
export interface UserStats {
    username: string;
    startDate: number; //epoch seconds

    totalTrackCount: number;
    totalListenedDuration: number;
    totalStorageUsed: number;
}