import { Suspense } from "react";
import { TrackCard } from "@/components/tracks/TrackCard";
import { TrackCardSkeletonGrid } from "@/components/tracks/TrackCardSkeleton";
import { getTracksWithProgress } from "@/lib/actions/track-progress";
import { PageContainer, PageNavSection, PageHeader } from "@/components/common";

export const metadata = {
  title: "Learning Tracks | Bug Battle Arena",
  description:
    "Browse learning tracks and master debugging skills across different domains.",
};

async function TracksContent() {
  const tracks = await getTracksWithProgress();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} />
      ))}
    </div>
  );
}

export default function TracksPage() {
  return (
    <PageContainer withScrollArea maxWidth="6xl">
      {/* Navigation Section */}
      <PageNavSection backHref="/" backLabel="Back to Home" showAuth />

      {/* Header */}
      <PageHeader
        title="Learning"
        highlightText="Tracks"
        description="Choose your learning path. Master debugging across different domains and build real-world problem-solving skills."
        align="left"
      />

      {/* Tracks Grid */}
      <Suspense fallback={<TrackCardSkeletonGrid />}>
        <TracksContent />
      </Suspense>
    </PageContainer>
  );
}
