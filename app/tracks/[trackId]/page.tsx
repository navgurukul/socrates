import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TrackHeader } from "@/components/tracks/TrackHeader";
import { ArcTimeline } from "@/components/tracks/ArcTimeline";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { getTrackDetail } from "@/lib/actions/track-progress";
import { PageContainer, PageAuthButton } from "@/components/common";

interface TrackDetailPageProps {
  params: {
    trackId: string;
  };
}

async function TrackDetailContent({ trackId }: { trackId: string }) {
  const trackDetail = await getTrackDetail(trackId);

  if (!trackDetail) {
    notFound();
  }

  const { track, arcs, overallProgress } = trackDetail;

  return (
    <div className="space-y-12">
      {/* Track Header */}
      <TrackHeader track={track} progress={overallProgress} />

      {/* Arc Timeline */}
      <div className="space-y-12">
        {arcs.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <h2 className="text-2xl font-bold text-zinc-400">Coming Soon</h2>
            <p className="text-zinc-500">
              Content for this track is currently in development. Check back
              soon!
            </p>
          </div>
        ) : (
          arcs.map((arc, index) => (
            <ArcTimeline key={arc.id} arc={arc} arcNumber={index + 1} />
          ))
        )}
      </div>
    </div>
  );
}

export default function TrackDetailPage({ params }: TrackDetailPageProps) {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <PageContainer withScrollArea maxWidth="6xl">
        {/* Auth Button */}
        <PageAuthButton />

        {/* Content */}
        <Suspense fallback={<LoadingScreen fullScreen={false} />}>
          <TrackDetailContent trackId={params.trackId} />
        </Suspense>
      </PageContainer>
    </main>
  );
}

// Generate static params for known tracks
export async function generateStaticParams() {
  // Import here to avoid circular dependencies
  const { getAllTracks } = await import("@/lib/content/tracks");
  const tracks = getAllTracks();

  return tracks.map((track) => ({
    trackId: track.id,
  }));
}
