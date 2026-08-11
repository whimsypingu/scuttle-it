import { useState } from "react";
import { useEditProfile } from "@/store/hooks/useEdit";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { convertDate, convertRelativeDate } from "@/features/profile/profile.utils";

import { MIN_BUTTON_WIDTH } from "@/features/edit/edit.constants";

import type { EditProfilePayload } from "@/store/hooks/hooks.types";
import { useSession } from "@/store/hooks/useSession";


interface EditRoomFormProps {
    onSave: () => void;
}

export const EditRoomForm = ({ 
    onSave 
}: EditRoomFormProps) => {
    const { sessionId, joinSession } = useSession();
    const [joinCodeInput, setJoinCodeInput] = useState("");

    const handleSave = () => {
        // if (usernameInput.length > 0 && usernameInput !== stats.username) {
        //     const payload: EditProfilePayload = {
        //         username: usernameInput,
        //     }
        //     editProfile(payload);
        // }
        onSave();
    }

    const joinUrl = encodeURIComponent(`${window.location.origin}/?s=${sessionId}`);

    return (
        <div className="flex flex-col h-full">
            <div className="h-full custom-scrollbar overflow-y-auto flex flex-col gap-4">
                {/* Username Section */}
                <div className="flex px-4 items-center justify-center">
                    <Input
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder={sessionId}
                        maxLength={4}
                        className="h-14 w-[10ch] text-2xl font-bold font-mono text-center tracking-[0.4em] pr-0 uppercase"
                    />
                </div>
                
                <div className="flex p-4 items-center justify-center">
                    <img
                        src={`/session/qr.png?url=${joinUrl}`}
                        alt={`QR Code for session ${sessionId}`}
                        className="w-full aspect-square rounded-lg bg-white p-1"
                        loading="lazy"
                    />
                </div>

                {/* 
                <div className="flex flex-row gap-3 items-center">
                    <label className="text-sm font-medium text-muted-foreground w-18 shrink-0">
                        Scuttled
                    </label>
                    <div className="flex flex-row items-baseline gap-3 select-all px-3">
                        <span className="text-md font-normal text-foreground">
                            {convertDate(stats.createdAt, { includeDay: true })}
                        </span>
                        
                        <span className="text-sm font-normal text-muted-foreground">
                            ({convertRelativeDate(stats.createdAt)})
                        </span>
                    </div>
                </div> */}
            </div>

            {/* Save */}
            <div className="flex justify-end pt-4">
                <Button
                    className={`min-w-[${MIN_BUTTON_WIDTH}px]`}
                    variant="secondary"
                    onClick={handleSave}
                >
                    Save
                </Button>
            </div>
        </div>
    );
};