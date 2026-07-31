"use client";

import { useState, useEffect } from "react";
import { useConfigStore } from "@/stores/config";
import { Eye, EyeOff, Save } from "lucide-react";

export function EnvEditor() {
  const { env, tier, fetchEnv, saveEnv } = useConfigStore();
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showCapsolver, setShowCapsolver] = useState(false);
  const [formData, setFormData] = useState({
    gemini_key: "",
    openai_key: "",
    llm_url: "",
    llm_model: "",
    capsolver_key: "",
  });

  useEffect(() => {
    fetchEnv();
  }, [fetchEnv]);

  useEffect(() => {
    if (env) {
      setFormData({
        gemini_key: env.gemini_key_set ? "••••••••••••••••" : "",
        openai_key: env.openai_key_set ? "••••••••••••••••" : "",
        llm_url: env.llm_url || "",
        llm_model: env.llm_model || "",
        capsolver_key: env.capsolver_key_set ? "••••••••••••••••" : "",
      });
    }
  }, [env]);

  const handleSave = async () => {
    await saveEnv({
      gemini_key: formData.gemini_key,
      openai_key: formData.openai_key,
      llm_url: formData.llm_url,
      llm_model: formData.llm_model,
      capsolver_key: formData.capsolver_key,
    });
  };

  const tierNames = ["Discovery", "Standard", "Premium", "Enterprise"];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">API Keys</h3>
          <div className="text-sm">
            <span className="text-[var(--text-muted)]">Current Tier: </span>
            <span className="text-[var(--accent)] font-semibold">
              {tierNames[tier - 1] || `Tier ${tier}`}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showGemini ? "text" : "password"}
                value={formData.gemini_key}
                onChange={(e) => setFormData({ ...formData, gemini_key: e.target.value })}
                placeholder="Enter Gemini API key"
                className="input flex-1"
              />
              <button
                className="btn btn-ghost"
                onClick={() => setShowGemini(!showGemini)}
              >
                {showGemini ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              OpenAI API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showOpenAI ? "text" : "password"}
                value={formData.openai_key}
                onChange={(e) => setFormData({ ...formData, openai_key: e.target.value })}
                placeholder="Enter OpenAI API key"
                className="input flex-1"
              />
              <button
                className="btn btn-ghost"
                onClick={() => setShowOpenAI(!showOpenAI)}
              >
                {showOpenAI ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              CapSolver API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showCapsolver ? "text" : "password"}
                value={formData.capsolver_key}
                onChange={(e) => setFormData({ ...formData, capsolver_key: e.target.value })}
                placeholder="Enter CapSolver API key"
                className="input flex-1"
              />
              <button
                className="btn btn-ghost"
                onClick={() => setShowCapsolver(!showCapsolver)}
              >
                {showCapsolver ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">LLM Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Local LLM URL
            </label>
            <input
              type="text"
              value={formData.llm_url}
              onChange={(e) => setFormData({ ...formData, llm_url: e.target.value })}
              placeholder="e.g., http://localhost:11434"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              LLM Model Override
            </label>
            <input
              type="text"
              value={formData.llm_model}
              onChange={(e) => setFormData({ ...formData, llm_model: e.target.value })}
              placeholder="e.g., llama2"
              className="input w-full"
            />
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>
        <Save size={16} />
        Save Configuration
      </button>
    </div>
  );
}
