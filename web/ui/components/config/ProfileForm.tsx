"use client";

import { useState, useEffect } from "react";
import { useConfigStore } from "@/stores/config";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { clsx } from "@/lib/utils";

type SectionKey =
  | "personal"
  | "work_authorization"
  | "availability"
  | "compensation"
  | "experience"
  | "skills_boundary"
  | "resume_facts"
  | "eeo_voluntary";

interface ProfileSection {
  title: string;
  key: SectionKey;
  fields: { key: string; label: string; type?: string }[];
  isKeyValue?: boolean;
}

const sections: ProfileSection[] = [
  {
    title: "Personal Information",
    key: "personal",
    fields: [
      { key: "name", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "linkedin_url", label: "LinkedIn URL" },
      { key: "github_url", label: "GitHub URL" },
      { key: "portfolio_url", label: "Portfolio URL" },
      { key: "location", label: "Location" },
    ],
  },
  {
    title: "Work Authorization",
    key: "work_authorization",
    fields: [
      { key: "legally_authorized", label: "Legally Authorized", type: "boolean" },
      { key: "require_sponsorship", label: "Require Sponsorship", type: "boolean" },
      { key: "work_permit_type", label: "Work Permit Type" },
    ],
  },
  {
    title: "Availability",
    key: "availability",
    fields: [
      { key: "earliest_start_date", label: "Earliest Start Date", type: "date" },
      { key: "full_time", label: "Full Time", type: "boolean" },
      { key: "contract", label: "Contract", type: "boolean" },
    ],
  },
  {
    title: "Compensation",
    key: "compensation",
    fields: [
      { key: "salary_expectation", label: "Salary Expectation", type: "number" },
      { key: "currency", label: "Currency" },
      { key: "range", label: "Range (e.g., 100k-150k)" },
    ],
  },
  {
    title: "Experience",
    key: "experience",
    fields: [
      { key: "years_total", label: "Years Total", type: "number" },
      { key: "education_level", label: "Education Level" },
      { key: "current_title", label: "Current Title" },
      { key: "current_company", label: "Current Company" },
      { key: "target_role", label: "Target Role" },
    ],
  },
  {
    title: "Skills Boundary",
    key: "skills_boundary",
    fields: [],
    isKeyValue: true,
  },
  {
    title: "Resume Facts",
    key: "resume_facts",
    fields: [
      { key: "preserved_companies", label: "Preserved Companies" },
      { key: "preserved_projects", label: "Preserved Projects" },
      { key: "preserved_school", label: "Preserved School" },
      { key: "real_metrics", label: "Real Metrics" },
    ],
  },
  {
    title: "EEO Voluntary",
    key: "eeo_voluntary",
    fields: [
      { key: "gender", label: "Gender" },
      { key: "race", label: "Race/Ethnicity" },
      { key: "veteran", label: "Veteran Status" },
      { key: "disability", label: "Disability Status" },
    ],
  },
];

export function ProfileForm() {
  const { profile, fetchProfile, saveProfile } = useConfigStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [skillCategory, setSkillCategory] = useState("");
  const [skillValue, setSkillValue] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const toggleSection = (key: string) => {
    setExpanded({ ...expanded, [key]: !expanded[key] });
  };

  const updateField = (section: SectionKey, key: string, value: unknown) => {
    const sectionData = formData[section] || {};
    setFormData({
      ...formData,
      [section]: { ...(sectionData as Record<string, unknown>), [key]: value },
    });
  };

  const handleSave = async (section: SectionKey) => {
    const sectionData = formData[section];
    if (sectionData) {
      await saveProfile({ ...formData, [section]: sectionData });
    }
  };

  const addSkill = () => {
    if (!skillCategory || !skillValue) return;
    const skills = (formData.skills_boundary as Record<string, unknown>) || {};
    const existing = (skills[skillCategory] as string[]) || [];
    setFormData({
      ...formData,
      skills_boundary: { ...skills, [skillCategory]: [...existing, skillValue] },
    });
    setSkillCategory("");
    setSkillValue("");
  };

  const removeSkill = (category: string, value: string) => {
    const skills = (formData.skills_boundary as Record<string, unknown>) || {};
    const existing = (skills[category] as string[]) || [];
    setFormData({
      ...formData,
      skills_boundary: { ...skills, [category]: existing.filter((v) => v !== value) },
    });
  };

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isExpanded = expanded[section.key];
        const sectionData = (formData[section.key] as Record<string, unknown>) || {};

        return (
          <div key={section.key} className="card">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => toggleSection(section.key)}
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{section.title}</h3>
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            {isExpanded && (
              <div className="mt-4 space-y-4">
                {section.isKeyValue ? (
                  <div>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Category (e.g., languages)"
                        value={skillCategory}
                        onChange={(e) => setSkillCategory(e.target.value)}
                        className="input flex-1"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g., Python)"
                        value={skillValue}
                        onChange={(e) => setSkillValue(e.target.value)}
                        className="input flex-1"
                      />
                      <button className="btn btn-primary" onClick={addSkill}>
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(sectionData).map(([cat, vals]) => (
                        <div key={cat} className="bg-[var(--bg-secondary)] rounded p-3">
                          <div className="font-medium text-[var(--text-primary)] mb-2">{cat}</div>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(vals) &&
                              vals.map((v) => (
                                <span
                                  key={v}
                                  className="inline-flex items-center gap-1 bg-[var(--bg-card)] px-2 py-1 rounded text-sm"
                                >
                                  {v}
                                  <button
                                    className="text-[var(--danger)] hover:text-[var(--danger)]"
                                    onClick={() => removeSkill(cat, v)}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">
                          {field.label}
                        </label>
                        {field.type === "boolean" ? (
                          <select
                            value={String(sectionData[field.key] ?? false)}
                            onChange={(e) =>
                              updateField(section.key, field.key, e.target.value === "true")
                            }
                            className="input w-full"
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        ) : field.type === "date" ? (
                          <input
                            type="date"
                            value={String(sectionData[field.key] ?? "")}
                            onChange={(e) =>
                              updateField(section.key, field.key, e.target.value)
                            }
                            className="input w-full"
                          />
                        ) : field.type === "number" ? (
                          <input
                            type="number"
                            value={String(sectionData[field.key] ?? "")}
                            onChange={(e) =>
                              updateField(section.key, field.key, Number(e.target.value))
                            }
                            className="input w-full"
                          />
                        ) : (
                          <input
                            type="text"
                            value={String(sectionData[field.key] ?? "")}
                            onChange={(e) =>
                              updateField(section.key, field.key, e.target.value)
                            }
                            className="input w-full"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className={clsx("btn btn-primary")}
                  onClick={() => handleSave(section.key)}
                >
                  <Save size={16} />
                  Save {section.title}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
