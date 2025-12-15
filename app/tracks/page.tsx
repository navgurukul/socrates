import { Suspense } from "react";
import { TrackCard } from "@/components/tracks/TrackCard";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { AuthButton } from "@/components/auth/AuthButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTracksWithProgress } from "@/lib/actions/track-progress";

export const metadata = {
  title: "Learning Tracks | Bug Battle Arena",
  description: "Browse learning tracks and master debugging skills across different domains.",
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
    <main className="min-h-screen bg-zinc-950 text-white">
      <ScrollArea className="h-screen">
        <div className="p-8">
          <div className="mx-auto max-w-6xl relative z-10">
            {/* Auth Button */}
            <div className="w-full flex justify-end mb-6">
              <AuthButton />
            </div>

            {/* Header */}
            <div className="mb-16 text-center space-y-4">
              <h1 className="text-5xl font-extrabold tracking-tight text-white">
                Learning <span className="text-emerald-400">Tracks</span>
              </h1>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Choose your learning path. Master debugging across different domains and build
                real-world problem-solving skills.
              </p>
            </div>

            {/* Tracks Grid */}
            <Suspense fallback={<LoadingScreen fullScreen={false} />}>
              <TracksContent />
            </Suspense>
          </div>
        </div>
      </ScrollArea>
    </main>
  );
}
