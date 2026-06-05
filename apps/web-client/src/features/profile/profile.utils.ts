//helper to turn seconds into a month and year
interface ConvertDateOptions {
    includeDay?: boolean;
}
export const convertDate = (s: number, options: ConvertDateOptions = {}): string => {
    if (!s || isNaN(s)) return "--";
    const date = new Date(s * 1000); //convert to ms for js
    const { includeDay = false } = options;

    return new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
        ...(includeDay && { day: "numeric" }), //conditionally include the day
    }).format(date); // May 2025 or something of that format
}

export const convertRelativeDate = (s: number): string => {
    if (!s || isNaN(s)) return "--";

    //calculate diff
    const targetDate = new Date(s * 1000);
    const currentDate = new Date();
    const diffInMs = targetDate.getTime() - currentDate.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

    if (Math.abs(diffInDays) < 30) {
        // less than a month, then show days ("4 days ago", "yesterday")
        return rtf.format(diffInDays, "day");
    } else if (Math.abs(diffInDays) < 365) {
        // less than a year, show months ("last month", "3 months ago")
        const diffInMonths = Math.round(diffInDays / 30.44);
        return rtf.format(diffInMonths, "month");
    } else {
        // over a year ("2 years ago")
        const diffInYears = Math.round(diffInDays / 365.25);
        return rtf.format(diffInYears, "year");
    }
}


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