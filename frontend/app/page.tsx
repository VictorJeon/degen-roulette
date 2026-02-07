import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import GameBoard from "@/components/GameBoard";
import BetPanel from "@/components/BetPanel";
import RecentPlays from "@/components/RecentPlays";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="grid grid-cols-1 desktop:grid-cols-[280px_1fr_280px] gap-4 desktop:gap-[2rem] p-4 desktop:p-[2rem] max-w-[1400px] mx-auto min-h-[calc(100vh-70px)]">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden desktop:flex flex-col gap-4">
          <Leaderboard />
        </aside>

        {/* Game Area */}
        <section className="flex flex-col items-center gap-8">
          <GameBoard />
          <BetPanel />
        </section>

        {/* Right Sidebar - Desktop */}
        <aside className="hidden desktop:flex flex-col gap-4">
          <RecentPlays />
        </aside>

        {/* Mobile Sidebars */}
        <div className="desktop:hidden flex flex-col gap-4 col-span-full">
          <Leaderboard />
          <RecentPlays />
        </div>
      </main>
    </div>
  );
}
