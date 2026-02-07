import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import GameBoard from "@/components/GameBoard";
import { LiveFeed } from "@/components/LiveFeed";

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
        </section>

        {/* Right Sidebar */}
        <aside className="sidebar">
          <LiveFeed />
        </aside>
      </main>
    </div>
  );
}
