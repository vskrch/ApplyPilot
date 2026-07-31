"use client";

import { useState, useEffect } from "react";
import { useConfigStore } from "@/stores/config";
import { FileText, CheckCircle } from "lucide-react";

export function ResumeUpload() {
  const { resumeText, hasResumePdf, fetchResume } = useConfigStore();
  const [text, setText] = useState("");

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  useEffect(() => {
    if (resumeText) {
      setText(resumeText);
    }
  }, [resumeText]);

  const handleSave = async () => {
    // Note: The API doesn't have a saveResume endpoint, so this is a placeholder
    // In a real implementation, you'd call api.saveResume(text)
    console.log("Saving resume:", text);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Current Resume</h3>
          {hasResumePdf && (
            <span className="flex items-center gap-2 text-[var(--success)]">
              <CheckCircle size={16} />
              PDF Available
            </span>
          )}
        </div>
        <div className="bg-[var(--bg-secondary)] rounded p-4 h-64 overflow-y-auto font-mono text-sm text-[var(--text-secondary)]">
          {resumeText ? (
            <pre className="whitespace-pre-wrap">{resumeText}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
              <FileText size={48} className="mr-4" />
              No resume uploaded
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Edit Resume Content</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your resume content here..."
          className="input w-full h-96 font-mono text-sm"
        />
        <div className="mt-4 flex gap-3">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            Note: PDF upload not yet implemented
          </span>
        </div>
      </div>
    </div>
  );
}
