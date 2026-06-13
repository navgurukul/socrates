import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-6 text-center text-white">
      <div className="space-y-2">
        <h1 className="text-6xl font-bold tracking-tight">404</h1>
        <p className="max-w-md text-sm text-zinc-400">
          We couldn&apos;t find the page you were looking for.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
