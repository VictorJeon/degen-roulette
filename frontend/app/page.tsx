import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import GameBoard from "@/components/GameBoard";
import { LiveFeed } from "@/components/LiveFeed";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <Header />

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[268px_1fr_260px] gap-4 lg:gap-[46px] px-4 lg:px-6 py-4 max-w-[1700px] mx-auto min-h-[calc(100vh-56px)] relative z-[1]">
        {/* Left Sidebar — hidden mobile, below game on tablet, left col on desktop */}
        <aside className="hidden md:flex flex-col gap-3 min-w-0 order-2 lg:order-1">
          <Leaderboard />
        </aside>

        {/* Game Area — always first visually */}
        <section className="flex flex-col items-center justify-start min-w-0 order-1 lg:order-2 col-span-full md:col-span-2 lg:col-span-1">
          <GameBoard />
        </section>

        {/* Right Sidebar — below game on mobile/tablet, right col on desktop */}
        <aside className="flex flex-col gap-3 min-w-0 order-3">
          <LiveFeed />
        </aside>
      </main>
    </div>
  );
}
