import TopBar from "@/components/TopBar";
import BottomBar from "@/components/BottomBar";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-brand-blue">
      <TopBar />
      <main className="flex-1">{children}</main>
      <BottomBar />
    </div>
  );
}
