import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import GameBoard from "@/components/GameBoard";
import { LiveFeed } from "@/components/LiveFeed";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <Header />

      <main className="grid grid-cols-[220px_1fr_300px] gap-2.5 p-2.5 max-w-[1560px] mx-auto min-h-[calc(100vh-56px)] relative z-[1] max-lg:grid-cols-1 max-lg:p-4">
        {/* Left Sidebar */}
        <aside className="flex flex-col gap-3 max-lg:hidden">
          <Leaderboard />
        </aside>

        {/* Game Area */}
        <section className="flex flex-col items-center justify-start min-h-[calc(100vh-76px)]">
          <GameBoard />
        </section>

        {/* Right Sidebar */}
        <aside className="flex flex-col gap-3 max-lg:hidden">
          <LiveFeed />
        </aside>
      </main>
    </div>
  );
}
