"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Tag } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const categories = ["Frontend", "Backend", "Smart Contract", "Design", "Mobile", "Documentation", "DevOps"];

export default function NewServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    skillInput: "",
    skills: [] as string[],
  });

  const handleAddSkill = () => {
    if (formData.skillInput && !formData.skills.includes(formData.skillInput)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, formData.skillInput],
        skillInput: "",
      });
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== "FREELANCER") {
      setError("Only freelancers can post services.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(`${API_URL}/services`, {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        skills: formData.skills,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      router.push("/services");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to create service listing.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-theme-heading mb-2">Create a Service</h1>
      <p className="text-theme-text mb-8">
        Showcase your expertise and get discovered by clients across the platform.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-theme-error/10 border border-theme-error/20 text-theme-error text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-theme-heading mb-2">
            Service Title
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Professional Soroban Smart Contract Development"
            className="input-field"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-heading mb-2">
            Description
          </label>
          <textarea
            required
            rows={6}
            placeholder="Detailed description of what you offer, your process, and deliverables..."
            className="input-field resize-none"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-theme-heading mb-2">
              Price (XLM)
            </label>
            <input
              type="number"
              required
              placeholder="500"
              className="input-field"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-heading mb-2">
              Category
            </label>
            <select
              required
              className="input-field cursor-pointer"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-heading mb-2">
            Skills
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="e.g., Rust"
              className="input-field"
              value={formData.skillInput}
              onChange={(e) => setFormData({ ...formData, skillInput: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
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
            {formData.skills.map((skill) => (
              <span key={skill} className="flex items-center gap-2 bg-theme-card border border-theme-border px-3 py-1.5 rounded-lg text-sm text-theme-text">
                <Tag size={14} /> {skill}
                <button type="button" onClick={() => handleRemoveSkill(skill)}>
                  <Plus className="rotate-45 text-theme-error hover:opacity-80 transition-colors" size={16} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-lg h-12 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : "Publish Service"}
        </button>
      </form>
    </div>
  );
}
