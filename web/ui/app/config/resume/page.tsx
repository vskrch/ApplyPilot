"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ResumeUpload } from "@/components/config/ResumeUpload";

export default function ResumePage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Resume"
        description="Manage your resume content"
      />
      <ResumeUpload />
    </div>
  );
}
