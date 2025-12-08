import Link from "next/link";
import { challenges } from "@/lib/content/challenges";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
            Bug Battle <span className="text-emerald-500">Arena</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Fix real-world bugs in a browser-based sandboxed environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Card
              key={challenge.id}
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant="outline"
                    className="text-zinc-400 border-zinc-700"
                  >
                    JS / Logic
                  </Badge>
                  {/* Placeholder for difficulty or status */}
                  <span className="text-xs text-zinc-500 font-mono">Easy</span>
                </div>
                <CardTitle className="text-xl text-white">
                  {challenge.title}
                </CardTitle>
                <CardDescription className="text-zinc-400 line-clamp-2">
                  {challenge.description}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href={`/battle/${challenge.id}`} className="w-full">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    Enter Arena
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
