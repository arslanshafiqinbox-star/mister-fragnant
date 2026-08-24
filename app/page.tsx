import Hero from "@/components/Hero";
import TopBar from "@/components/TopBar";
import FragranceStrip from "@/components/FragranceStrip";
import SponsoredStrip from "@/components/SponsoredStrip";
import FragranceCabinet from "@/components/FragranceCabinet";
import FragranceFavourites from "@/components/FragranceFavourites";
import FragranceAlternatives from "@/components/FragranceAlternatives";
import AddFragrance from "@/components/AddFragrance";
import FragranceNotes from "@/components/FragranceNotes";
import FragranceFilms from "@/components/FragranceFilms";
import NewsletterSignup from "@/components/NewsletterSignup";
import BottomBar from "@/components/BottomBar";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <TopBar />
      <Hero />
      <FragranceStrip />
      <SponsoredStrip />
      <FragranceCabinet />
      <FragranceFavourites />
      <FragranceAlternatives />
    
      <FragranceNotes />
      <FragranceFilms />
      <AddFragrance />
      <NewsletterSignup />
      <BottomBar />
    </main>
  );
}
