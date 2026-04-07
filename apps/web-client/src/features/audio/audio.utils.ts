//helper to turn seconds into MM:SS
export const formatTime = (s: number) => {
    if (isNaN(s)) return "--:--";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};