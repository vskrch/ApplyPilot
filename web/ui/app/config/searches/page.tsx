"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SearchEditor } from "@/components/config/SearchEditor";

export default function SearchesPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Search Configuration"
        description="Manage job search queries and filters"
      />
      <SearchEditor />
    </div>
  );
}
