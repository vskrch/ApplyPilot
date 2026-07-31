"use client";

import { useState, useEffect } from "react";
import { useConfigStore } from "@/stores/config";
import { Plus, Trash2, Save } from "lucide-react";

interface SearchEntry {
  query: string;
  location: string;
  boards: string[];
  max_results: number;
}

export function SearchEditor() {
  const { searches, fetchSearches, saveSearches } = useConfigStore();
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [locationAccept, setLocationAccept] = useState("");
  const [locationReject, setLocationReject] = useState("");

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  useEffect(() => {
    if (searches) {
      setEntries((searches.entries as SearchEntry[]) || []);
      setLocationAccept((searches.location_accept as string) || "");
      setLocationReject((searches.location_reject as string) || "");
    }
  }, [searches]);

  const addEntry = () => {
    setEntries([...entries, { query: "", location: "", boards: [], max_results: 50 }]);
  };

  const updateEntry = (index: number, field: keyof SearchEntry, value: unknown) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await saveSearches({
      entries,
      location_accept: locationAccept,
      location_reject: locationReject,
    });
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Search Entries</h3>
          <button className="btn btn-primary" onClick={addEntry}>
            <Plus size={16} />
            Add Search
          </button>
        </div>
        {entries.length === 0 ? (
          <div className="text-[var(--text-muted)] text-center py-8">No search entries</div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, i) => (
              <div key={i} className="bg-[var(--bg-secondary)] rounded p-4">
                <div className="flex justify-end mb-2">
                  <button
                    className="text-[var(--danger)] hover:text-[var(--danger)]"
                    onClick={() => removeEntry(i)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Query</label>
                    <input
                      type="text"
                      value={entry.query}
                      onChange={(e) => updateEntry(i, "query", e.target.value)}
                      placeholder="e.g., Software Engineer"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Location</label>
                    <input
                      type="text"
                      value={entry.location}
                      onChange={(e) => updateEntry(i, "location", e.target.value)}
                      placeholder="e.g., San Francisco, CA"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Max Results</label>
                    <input
                      type="number"
                      value={entry.max_results}
                      onChange={(e) => updateEntry(i, "max_results", Number(e.target.value))}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Boards (comma-separated)</label>
                    <input
                      type="text"
                      value={entry.boards.join(", ")}
                      onChange={(e) =>
                        updateEntry(i, "boards", e.target.value.split(",").map((s) => s.trim()))
                      }
                      placeholder="e.g., linkedin, indeed"
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Location Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Location Accept (regex patterns)
            </label>
            <textarea
              value={locationAccept}
              onChange={(e) => setLocationAccept(e.target.value)}
              placeholder="e.g., San Francisco|Bay Area"
              className="input w-full h-24"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Location Reject (regex patterns)
            </label>
            <textarea
              value={locationReject}
              onChange={(e) => setLocationReject(e.target.value)}
              placeholder="e.g., Junior|Intern"
              className="input w-full h-24"
            />
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>
        <Save size={16} />
        Save Search Configuration
      </button>
    </div>
  );
}
