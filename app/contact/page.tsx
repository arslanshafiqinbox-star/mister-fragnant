import TopBar from "@/components/TopBar";
import ContactForm from "@/components/ContactForm";
import BottomBar from "@/components/BottomBar";

export default function ContactPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-white">
      <TopBar />
      <section className="flex-1 px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <ContactForm />
      </section>
      <BottomBar />
    </main>
  );
}
