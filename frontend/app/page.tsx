import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import GameArea from "@/components/GameArea";
import RecentPlays from "@/components/RecentPlays";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8 p-8 max-w-[1400px] mx-auto min-h-[calc(100vh-70px)]">
        <aside className="hidden lg:block">
          <Leaderboard />
        </aside>
        
        <section>
          <GameArea />
        </section>
        
        <aside className="hidden lg:block">
          <RecentPlays />
        </aside>
      </main>
      
      {/* Mobile Leaderboard & Recent Plays */}
      <div className="lg:hidden px-4 pb-8 space-y-4">
        <Leaderboard />
        <RecentPlays />
      </div>
    </div>
  );
}
