import type { ArtistBase } from "@/track/track.types";
import { SealCheckIcon } from "@phosphor-icons/react";

const OFFICIAL_PREFIXES = ["MB__"];

// checks if the artist id belongs to an official database like MusicBrainz
const isOfficialArtist = (artist: ArtistBase) => {
    return OFFICIAL_PREFIXES.some((prefix) => artist.id.startsWith(prefix));
};

export interface VerifiedArtistBadgeProps {
    artist: ArtistBase;
    className?: string;
    size?: number;
}

export const VerifiedArtistBadge = ({
    artist,
    className = "inline-block shrink-0",
    size = 16,
}: VerifiedArtistBadgeProps) => {
    if (!isOfficialArtist(artist)) {
        return null;
    }

    return (
        <SealCheckIcon
            weight="fill"
            size={size}
            className={className}
            aria-label="Verified Official Metadata"
        />
    );
};

// const VerifiedBadge = ({ id, className = "inline-block shrink-0" }: VerifiedBadgeProps) => {
//     if (!isOfficialArtist(id)) return null;

//     return (
//         <SealCheckIcon 
//             weight="fill" 
//             className={className} 
//             aria-label="Verified Official Metadata" 
//         />
//     );
// };