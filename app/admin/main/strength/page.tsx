"use client";

import NamedEntityAdminPage from "@/components/admin/NamedEntityAdminPage";

export default function AdminStrengthPage() {
  return (
    <NamedEntityAdminPage
      apiPath="/api/strength"
      title="Strength"
      subtitle="Manage concentration / strength labels used across the catalog."
      entityLabel="Strength"
    />
  );
}
