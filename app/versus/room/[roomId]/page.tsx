import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoom } from "@/lib/actions/versus";
import { VersusRoom } from "@/components/versus/VersusRoom";

interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function VersusRoomPage({ params }: Props) {
  const { roomId } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/versus");
  }

  const result = await getRoom(roomId);

  if ("error" in result) {
    redirect("/versus");
  }

  const { room, participants } = result;

  // Check if user is a participant
  const isParticipant = participants.some((p) => p.userId === user.id);
  if (!isParticipant) {
    redirect("/versus");
  }

  const isHost = room.hostUserId === user.id;

  return (
    <VersusRoom
      initialRoom={room}
      initialParticipants={participants}
      currentUserId={user.id}
      isHost={isHost}
    />
  );
}
