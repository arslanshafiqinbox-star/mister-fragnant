import TopBar from "@/components/TopBar";
import ContactForm from "@/components/ContactForm";
import BottomBar from "@/components/BottomBar";

export default function ContactPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-brand-cream">
      <TopBar />
      <div className="flex-1">
        <ContactForm />
      </div>
      <BottomBar />
    </main>
  );
}
