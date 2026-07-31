"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { EnvEditor } from "@/components/config/EnvEditor";

export default function EnvPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Environment Configuration"
        description="Manage API keys and LLM settings"
      />
      <EnvEditor />
    </div>
  );
}
