import { useEffect, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HoldToDeleteButton } from "@/components/ui/hold-delete";

import { MIN_BUTTON_WIDTH, SOURCE_ICON_SIZE } from "@/features/edit/edit.constants";
import type { UserStats } from "@/features/profile/profile.types";


interface EditProfileFormProps {
    stats: UserStats;
    onSave: () => void;
}

export const EditProfileForm = ({ 
    stats,
    onSave 
}: EditProfileFormProps) => {
    const [usernameInput, setUsernameInput] = useState(stats.username);

    const handleSave = () => {
        onSave();
    }

    return (
        <div className="flex flex-col h-full">
            <div className="h-full custom-scrollbar overflow-y-auto flex flex-col gap-4">
                {/* Username Section */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                        Username
                    </label>
                    <Textarea
                        value={stats.username}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder={stats.username}
                        className="text-md focus-visible:ring-1"
                    />
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