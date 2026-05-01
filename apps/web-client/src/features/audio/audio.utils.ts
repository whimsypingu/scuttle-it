//helper to turn seconds into MM:SS
export const formatTime = (s: number) => {
    if (isNaN(s)) return "--:--";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

//helper to turn seconds into text formatted duration
export const formatReadableTime = (s: number): string => {
    if (isNaN(s)) return "0s";

    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);

    //more than an hour, eg: 1h 2m
    if (hrs > 0) {
        return `${hrs}h ${mins}m`;
    }

    //minutes and seconds, eg: 2m 45s
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }

    //just the seconds, eg: 45s
    return `${secs}s`;
}