import { useState } from "react";
import { usePlaylistsMutations } from "@/store/hooks/usePlaylists";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { generateUUID } from "@/lib/generate";

import type { CreatePlaylistMutationProps } from "@/store/hooks/hooks.types";


interface CreatePlaylistFormProps {
    onSave: () => void;
}

export const CreatePlaylistForm = ({ 
    onSave 
}: CreatePlaylistFormProps) => {
    const [nameInput, setNameInput] = useState("");
    const [descriptionInput, setDescriptionInput] = useState("");

    //edit hook
    const { createPlaylist } = usePlaylistsMutations();

    const handleSave = () => {
        const createPlaylistVars: CreatePlaylistMutationProps = {
            playlistId: generateUUID(), //generates a standard v4 UUID for the playlist ID if in a secure context, otherwise a custom `insecure-xxxx...` id
            name: nameInput,
            //put description in here later
        }
        createPlaylist(createPlaylistVars);
        onSave();
    }

    return (
        <div className="flex flex-col h-full">
            <div className="h-full custom-scrollbar overflow-y-auto flex flex-col gap-2">
                {/* Name Section */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                        Name
                    </label>
                    <Textarea
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder={"Give this playlist a name..."}
                        className="text-md focus-visible:ring-1"
                    />
                </div>

                {/* Description Section */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                        Description
                    </label>
                    <Textarea
                        value={descriptionInput}
                        onChange={(e) => setDescriptionInput(e.target.value)}
                        placeholder={"Write a little about this playlist..."}
                        className="text-md focus-visible:ring-1"
                    />
                </div>

                <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam elit orci, condimentum vel elit sed, lobortis aliquam mi. Sed consequat iaculis dolor ultricies vestibulum. Morbi eget urna sed tellus maximus sollicitudin volutpat eu augue. Maecenas ultricies magna vel arcu eleifend bibendum. Fusce id turpis id tortor molestie dictum non ac ipsum. Sed libero ex, vulputate ut mauris at, vestibulum lobortis risus. Nunc gravida at magna vitae malesuada. Aenean efficitur, massa nec ultrices elementum, libero ipsum placerat ante, in venenatis nunc diam sit amet tortor. Integer id malesuada massa, in congue velit. Nam et faucibus eros.

    Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin ac fermentum mauris, sed elementum libero. Aliquam erat volutpat. Donec fermentum ante quis nunc rhoncus, a consequat nunc blandit. Vivamus mollis nunc et lacus rhoncus, vel maximus ex maximus. Nulla ut augue blandit, sodales metus non, efficitur est. Donec dictum dui arcu, sit amet iaculis tellus semper id. Vivamus sapien dui, iaculis non efficitur vitae, placerat nec lorem. Ut malesuada rutrum efficitur. Aenean tincidunt, neque eget laoreet dictum, lectus sapien finibus enim, id dapibus purus turpis sed turpis. Suspendisse in odio ipsum.

    Phasellus gravida at ligula vel sagittis. Suspendisse diam risus, eleifend ut magna ut, convallis rutrum lorem. Suspendisse sodales, augue vel pharetra imperdiet, metus felis maximus dui, at dapibus mi orci et arcu. Suspendisse ullamcorper, erat ac lobortis euismod, nisi turpis consequat lectus, vitae ultrices orci magna sit amet justo. Vivamus vitae dignissim ligula. Sed sed vehicula sem. Aenean euismod justo sapien, eget ultricies erat aliquam at. Cras et ligula sollicitudin, elementum nisi eget, rhoncus quam. Maecenas venenatis, ipsum eu hendrerit consequat, purus est pharetra ipsum, eu sagittis arcu felis vitae elit. Aliquam fringilla, ex id blandit venenatis, enim ipsum convallis risus, sed imperdiet purus velit a turpis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nulla quis lectus gravida, sollicitudin urna in, lacinia ipsum. Duis at sapien magna. Maecenas ac hendrerit augue, a facilisis sem. Phasellus sagittis luctus nulla nec convallis.

    Nunc sit amet lacus tincidunt, hendrerit metus ac, iaculis lectus. Integer placerat elementum odio, sit amet imperdiet libero faucibus congue. Nullam eget ullamcorper dolor. Integer dignissim mi quis dolor condimentum, interdum porta dolor maximus. Donec pellentesque non ante in congue. In consequat tortor quis libero efficitur suscipit. Aenean ornare id velit porttitor maximus. In hac habitasse platea dictumst. In mollis scelerisque porta. Quisque justo diam, consequat ultricies ante ut, commodo dapibus ligula. Duis arcu orci, tempus aliquam arcu at, feugiat mollis eros. Sed id tempor metus, vitae lacinia nisi.

    Proin rutrum nibh nibh, quis pretium arcu consectetur ut. Praesent mauris nisi, congue sed erat vel, ultrices auctor lorem. Donec consectetur dignissim volutpat. In suscipit molestie arcu, vel vestibulum purus interdum ut. Sed malesuada, augue sit amet tincidunt finibus, justo tortor sagittis elit, non varius nisi magna at lorem. Fusce sed ipsum diam. Phasellus ornare leo in turpis ornare congue. Morbi nibh arcu, cursus vitae orci vitae, tincidunt euismod ligula. Ut et augue vitae metus bibendum egestas. In luctus lectus in ultrices cursus. Praesent rhoncus malesuada purus, sed elementum tellus finibus in. Vivamus dictum dolor ut efficitur dictum. Vivamus maximus est et congue dapibus. Cras tristique sem eu dignissim sodales. Nunc pellentesque dui sollicitudin suscipit imperdiet. Quisque facilisis ornare volutpat.                
                </p>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-4">
                <Button
                    className="min-w-[80px]"
                    variant="secondary"
                    onClick={handleSave}
                >
                    Create
                </Button>
            </div>
        </div>
    );
};