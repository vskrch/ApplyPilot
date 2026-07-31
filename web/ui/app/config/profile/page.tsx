"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "@/components/config/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Profile Configuration"
        description="Manage your personal information and preferences"
      />
      <ProfileForm />
    </div>
  );
}
