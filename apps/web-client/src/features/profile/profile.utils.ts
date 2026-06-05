//helper to turn seconds into a month and year
export const convertDate = (s: number) => {
    if (!s || isNaN(s)) return "--";
    const date = new Date(s * 1000); //convert to ms for js
    return new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
    }).format(date); // May 2025 or something of that format
}

export const convertFullDateWithRelative = (s: number): string => {
    if (!s || isNaN(s)) return "--";

    const targetDate = new Date(s * 1000);
    const absoluteDate = new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(targetDate);

    //calculate diff
    const currentDate = new Date();
    const diffInMs = targetDate.getTime() - currentDate.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    let relativePhrase = "";

    if (Math.abs(diffInDays) < 30) {
        // less than a month, then show days ("4 days ago", "yesterday")
        relativePhrase = rtf.format(diffInDays, "day");
    } else if (Math.abs(diffInDays) < 365) {
        // less than a year, show months ("last month", "3 months ago")
        const diffInMonths = Math.round(diffInDays / 30.44);
        relativePhrase = rtf.format(diffInMonths, "month");
    } else {
        // over a year ("2 years ago")
        const diffInYears = Math.round(diffInDays / 365.25);
        relativePhrase = rtf.format(diffInYears, "year");
    }

    return `${absoluteDate} (${relativePhrase})`; // "February 12, 2026 (4 days ago)"
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