import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoom } from "@/lib/actions/verses";
import { VersesRoom } from "@/components/verses/VersesRoom";

interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function VersesRoomPage({ params }: Props) {
  const { roomId } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/verses");
  }

  const result = await getRoom(roomId);

  if ("error" in result) {
    redirect("/verses");
  }

  const { room, participants } = result;

  // Check if user is a participant
  const isParticipant = participants.some((p) => p.userId === user.id);
  if (!isParticipant) {
    redirect("/verses");
  }

  const isHost = room.hostUserId === user.id;

  return (
    <VersesRoom
      initialRoom={room}
      initialParticipants={participants}
      currentUserId={user.id}
      isHost={isHost}
    />
  );
}
