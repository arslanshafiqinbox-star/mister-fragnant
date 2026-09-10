"use client";

import NamedEntityAdminPage from "@/components/admin/NamedEntityAdminPage";

export default function AdminGenderPage() {
  return (
    <NamedEntityAdminPage
      apiPath="/api/gender"
      title="Gender"
      subtitle="Manage gender labels used across the catalog."
      entityLabel="Gender"
    />
  );
}
