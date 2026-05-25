export const convertDuration = (s: number): { durationLabel: string, durationStr: string } => {
    const isHours = s >= (60 * 60);
    const durationLabel = isHours ? "Hours Listened" : "Minutes Listened";
    const durationStr = (s / (isHours ? (60 * 60) : 60)).toFixed(2);

    return {
        durationLabel,
        durationStr,
    }
};

export const convertStorage = (bytes: number): { storageStr: string, storageSuffix: string } => {
    const isGB = bytes >= (1024 * 1024 * 1024);
    let storageStr = (bytes / (isGB ? (1024 * 1024 * 1024) : (1024 * 1024))).toFixed(2);
    let storageSuffix = isGB ? "GB" : "MB";

    return {
        storageStr,
        storageSuffix,
    }
}