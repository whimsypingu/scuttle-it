import { useState } from "react";
import { useEditProfile } from "@/store/hooks/useEdit";
import { useAuth } from "@/store/hooks/useAuth";
import { useOffline } from "@/features/offline/OfflineProvider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { convertDate, convertRelativeDate } from "@/features/profile/profile.utils";

import { MIN_BUTTON_WIDTH } from "@/features/edit/edit.constants";

import type { UserStats } from "@/features/profile/profile.types";
import type { EditProfilePayload } from "@/store/hooks/hooks.types";


interface EditProfileFormProps {
    stats: UserStats;
    onSave: () => void;
}

export const EditProfileForm = ({ 
    stats,
    onSave 
}: EditProfileFormProps) => {
    const [usernameInput, setUsernameInput] = useState(stats.username);

    const { logout } = useAuth();
    const { editProfile } = useEditProfile();
    const { isOffline } = useOffline();

    const handleLogout = () => {
        logout();
    }

    const handleSave = () => {
        if (usernameInput.length > 0 && usernameInput !== stats.username) {
            const payload: EditProfilePayload = {
                username: usernameInput,
            }
            editProfile(payload);
        }
        onSave();
    }

    return (
        <div className="flex flex-col h-full">
            <div className="h-full custom-scrollbar overflow-y-auto flex flex-col gap-4">
                {/* Username Section */}
                <div className="flex flex-row gap-3 items-center">
                    <label className="text-sm font-medium text-muted-foreground w-18 shrink-0">
                        Username
                    </label>
                    {isOffline ? (
                        <>
                        <div className="flex flex-row items-baseline gap-3 select-all px-3">
                            <span className="text-md font-normal text-foreground">
                                {stats.username}
                            </span>
                        </div>
                        </>
                    ) : (
                        <>
                        <Input
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            placeholder={stats.username}
                            className="text-md"
                        />
                        </>
                    )}
                </div>

                {/* Created Date Section */}
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
                </div>
            </div>

            {/* Save */}
            {!isOffline && (
                <>
                <div className="flex justify-between pt-4">
                    <Button
                        className={`min-w-[${MIN_BUTTON_WIDTH}px]`}
                        variant="ghost"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>

                    <Button
                        className={`min-w-[${MIN_BUTTON_WIDTH}px]`}
                        variant="secondary"
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </div>
                </>
            )}
        </div>
    );
};