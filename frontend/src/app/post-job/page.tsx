"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Tag, Loader2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface MilestoneForm {
  title: string;
  description: string;
  amount: string;
}

export default function PostJobPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [milestones, setMilestones] = useState<MilestoneForm[]>([
    { title: "", description: "", amount: "" },
  ]);

  useEffect(() => {
    if (!isLoading && user !== null && user.role !== "CLIENT") {
      toast.error(
        "Only clients can post jobs. Switch your role in Settings.",
      );
      router.replace("/dashboard");
    }
  }, [isLoading, user, router, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-stellar-blue" size={48} />
      </div>
    );
  }

  if (user?.role !== "CLIENT") {
    return null;
  }

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", description: "", amount: "" }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (index: number, field: keyof MilestoneForm, value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const totalBudget = milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/jobs`,
        {
          title,
          description,
          category,
          deadline: new Date(deadline).toISOString(),
          skills,
          budget: totalBudget,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      for (const m of milestones) {
        await axios.post(
          `${API_URL}/milestones`,
          {
            jobId: res.data.id,
            title: m.title,
            description: m.description,
            amount: parseFloat(m.amount),
            dueDate: deadline,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      router.push(`/jobs/${res.data.id}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to post job. Please try again.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-theme-heading mb-2">Post a Job</h1>
      <p className="text-theme-text mb-8">
        Describe your project and set milestones. Funds will be locked in escrow
        when a freelancer is accepted.
      </p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 rounded-lg bg-theme-error/10 border border-theme-error/20 text-theme-error text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-theme-heading mb-2">
            Job Title
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Build Soroban DEX Frontend"
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-theme-heading mb-2">
            Description
          </label>
          <textarea
            required
            rows={6}
            placeholder="Describe the project requirements, scope, and deliverables..."
            className="input-field resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-theme-heading mb-2">
            Category
          </label>
          <select
            required
            className="input-field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a category</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="Smart Contract">Smart Contract</option>
            <option value="Design">Design</option>
            <option value="Mobile">Mobile</option>
            <option value="Documentation">Documentation</option>
            <option value="DevOps">DevOps</option>
          </select>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-theme-heading mb-2">
            Deadline
          </label>
          <input
            type="date"
            required
            className="input-field"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-theme-heading mb-2">
            Required Skills
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="e.g., Rust"
              className="input-field"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="btn-secondary px-4 h-11 flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-2 bg-theme-card border border-theme-border px-3 py-1.5 rounded-lg text-sm text-theme-text"
              >
                <Tag size={14} /> {skill}
                <button type="button" onClick={() => handleRemoveSkill(skill)}>
                  <Plus
                    className="rotate-45 text-theme-error hover:opacity-80 transition-colors"
                    size={16}
                  />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-theme-heading">
              Milestones
            </label>
            <button
              type="button"
              onClick={addMilestone}
              className="flex items-center gap-1 text-sm text-stellar-blue hover:text-stellar-purple transition-colors"
            >
              <Plus size={16} /> Add Milestone
            </button>
          </div>

          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={index} className="card relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-stellar-purple">
                    Milestone {index + 1}
                  </span>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Milestone title"
                    className="input-field"
                    value={milestone.title}
                    onChange={(e) => updateMilestone(index, "title", e.target.value)}
                  />
                  <textarea
                    rows={2}
                    placeholder="Describe the deliverables for this milestone"
                    className="input-field resize-none"
                    value={milestone.description}
                    onChange={(e) => updateMilestone(index, "description", e.target.value)}
                  />
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Amount (XLM)"
                      className="input-field"
                      value={milestone.amount}
                      onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="card flex items-center justify-between">
          <span className="text-theme-heading font-semibold">Total Budget</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-stellar-blue to-stellar-purple bg-clip-text text-transparent">
            {totalBudget.toLocaleString()} XLM
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full text-lg h-12 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="animate-spin" size={24} /> : "Post Job & Fund Escrow"}
        </button>
      </form>
    </div>
  );
}
