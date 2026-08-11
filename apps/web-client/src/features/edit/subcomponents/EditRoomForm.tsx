import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { MIN_BUTTON_WIDTH } from "@/features/edit/edit.constants";
import { useSession } from "@/store/hooks/useSession";
import { makeToast } from "@/features/toast/Toast";


interface EditRoomFormProps {
    onSave: () => void;
}

export const EditRoomForm = ({ 
    onSave 
}: EditRoomFormProps) => {
    const { sessionId, createSession, joinSessionAsync } = useSession();
    const [joinCodeInput, setJoinCodeInput] = useState("");

    const handleSave = async () => {
        if (joinCodeInput && joinCodeInput != sessionId) {
            try {
                await joinSessionAsync(joinCodeInput);
            } catch (err) {
                makeToast("Invalid: ", joinCodeInput);
            }
        }
        onSave();
    }

    const handleCreate = () => {
        createSession();
        onSave();
    }

    const joinUrl = encodeURIComponent(`${window.location.origin}/?s=${sessionId}`);

    return (
        <div className="flex flex-col h-full">
            <div className="h-full custom-scrollbar overflow-y-auto flex flex-col gap-4">
                {/* Current/Join Room Code */}
                <div className="flex px-4 items-center justify-center">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSave();
                        }}
                    >
                        <Input
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                            placeholder={sessionId}
                            maxLength={4}
                            className="h-14 w-[10ch] text-2xl font-bold font-mono text-center tracking-[0.4em] pr-0 uppercase"
                        />
                    </form>
                </div>
                
                {/* QR code */}
                <div className="flex py-4 items-center justify-center">
                    <img
                        src={`/session/qr.png?url=${joinUrl}`}
                        alt={`QR Code for session ${sessionId}`}
                        className="w-full aspect-square rounded-lg bg-white p-1"
                        loading="lazy"
                    />
                </div>

                {/* Create Button */}
                <div className="flex px-4 items-center justify-center">
                    <Button
                        className="p-6"
                        variant="secondary"
                        onClick={handleCreate}
                    >
                        New Room
                    </Button>
                </div>
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