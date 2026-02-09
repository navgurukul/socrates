import { createClient } from "@/lib/supabase/server";
import { VersesLandingContent } from "@/components/verses/VersesLandingContent";
import { PageContainer, PageNavSection } from "@/components/common";

export const metadata = {
  title: "Verses | Bug Battle Arena",
  description:
    "Challenge your friends to real-time multiplayer debugging battles.",
};

export default async function VersesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PageContainer withScrollArea>
      <PageNavSection backHref="/" backLabel="Back to Home" showAuth />
      <VersesLandingContent isAuthenticated={!!user} />
    </PageContainer>
  );
}
