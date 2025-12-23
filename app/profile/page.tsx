import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/actions/user-profile";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { NeuralLink } from "@/components/profile/NeuralLink";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { BattleHistory } from "@/components/profile/BattleHistory";
import { BackButton, PageContainer, PageNavSection } from "@/components/common";

export default async function ProfilePage() {
  const profileData = await getUserProfile();

  // Redirect to home if user is not authenticated
  if (!profileData) {
    redirect("/?auth_error=Please sign in to view your profile");
  }

  return (
    <PageContainer withScrollArea className="space-y-8">
      {/* Navigation Section */}
      <PageNavSection backHref="/" backLabel="Back to Home" showAuth />

      {/* Header Section */}
      <ProfileHeader
        user={profileData.user}
        streaks={profileData.streaks}
        stats={profileData.stats}
      />

      {/* Two-column grid on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Neural Analysis */}
        <NeuralLink insights={profileData.insights} />

        {/* Battle History */}
        <BattleHistory userId={profileData.user.id} />

        {/* Activity Activity */}
        <ActivityHeatmap
          activity={profileData.activity}
          className="col-span-full"
        />
      </div>
    </PageContainer>
  );
}
