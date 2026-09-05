import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { MIN_BUTTON_WIDTH } from "@/features/edit/edit.constants";
import { useRoom } from "@/store/hooks/useRoom";
import { makeToast } from "@/features/toast/Toast";


interface EditRoomFormProps {
    onSave: () => void;
}

export const EditRoomForm = ({ 
    onSave 
}: EditRoomFormProps) => {
    const { roomId, createRoom, joinRoomAsync } = useRoom();
    const [joinCodeInput, setJoinCodeInput] = useState("");

    const handleSave = async () => {
        if (joinCodeInput && joinCodeInput != roomId) {
            try {
                await joinRoomAsync(joinCodeInput);
            } catch (err) {
                makeToast("Invalid: ", joinCodeInput);
            }
        }
        onSave();
    }

    const handleCreate = () => {
        createRoom();
        onSave();
    }

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
                            onChange={(e) => {
                                const filteredValue = e.target.value.toUpperCase().replace(/[^A-Z0]/g, "");
                                setJoinCodeInput(filteredValue);
                            }}
                            placeholder={roomId}
                            maxLength={4}
                            className="h-14 w-[10ch] text-2xl font-bold font-mono text-center tracking-[0.4em] pr-0 uppercase"
                        />
                    </form>
                </div>
                
                {/* QR code */}
                <div className="flex px-4 py-4 items-center justify-center">
                    <img
                        src={`/room/qr.png?roomId=${roomId}`}
                        alt={`QR Code for room ${roomId}`}
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