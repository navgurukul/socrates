import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/actions/user-profile";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { NeuralLink } from "@/components/profile/NeuralLink";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { BattleHistory } from "@/components/profile/BattleHistory";
import { BackButton } from "@/components/common";

export default async function ProfilePage() {
  const profileData = await getUserProfile();

  // Redirect to home if user is not authenticated
  if (!profileData) {
    redirect("/?auth_error=Please sign in to view your profile");
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 md:p-8 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Back Button */}
        <BackButton href="/" label="Back to Home" />

        {/* Header Section */}
        <ProfileHeader
          user={profileData.user}
          streaks={profileData.streaks}
          stats={profileData.stats}
        />
        {/* Activity Heatmap */}

        {/* Two-column grid on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Neural Analysis */}
          <NeuralLink insights={profileData.insights} />

          {/* Battle History - Full Width */}
          <BattleHistory userId={profileData.user.id} />
        </div>

        <ActivityHeatmap activity={profileData.activity} />
      </div>
    </main>
  );
}
