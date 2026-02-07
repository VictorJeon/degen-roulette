import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import GameBoard from "@/components/GameBoard";
import BetPanel from "@/components/BetPanel";
import RecentPlays from "@/components/RecentPlays";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="main">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <Leaderboard />
        </aside>

        {/* Game Area */}
        <section className="game-area">
          <GameBoard />
          <BetPanel />
        </section>

        {/* Right Sidebar */}
        <aside className="sidebar">
          <RecentPlays />
        </aside>
      </main>
    </div>
  );
}
