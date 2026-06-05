export interface ProfileTabProps {
    tabResetSignal: number;
}

/**
 * useProfile
 */
export interface UserStats {
    username: string;
    createdAt: number; //epoch seconds

    totalTrackCount: number;
    totalListenedDuration: number;
    totalStorageUsed: number;
}