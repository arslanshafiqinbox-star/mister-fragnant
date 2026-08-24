import AdminMainShell from "@/components/admin/AdminMainShell";

export default function AdminMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminMainShell>{children}</AdminMainShell>;
}
