import { Suspense } from "react";
import { PageContainer, PageNavSection, PageHeader } from "@/components/common";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { VersusLandingContent } from "@/components/versus/VersusLandingContent";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Versus | Bug Battle Arena",
  description:
    "Compete head-to-head with other debuggers. Solve the most challenges to win!",
};

export default async function VersusPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PageContainer withScrollArea>
      <PageNavSection backHref="/" backLabel="Back to Home" showAuth />

      <PageHeader
        title="Versus"
        highlightText="Arena"
        description="Compete head-to-head with other debuggers in real-time. Solve the most challenges within the time limit to claim victory!"
        align="center"
      />

      <Suspense fallback={<LoadingScreen fullScreen={false} />}>
        <VersusLandingContent isAuthenticated={!!user} />
      </Suspense>
    </PageContainer>
  );
}
