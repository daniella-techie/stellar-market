"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface MilestoneForm {
  title: string;
  description: string;
  amount: string;
}

export default function PostJobPage() {
  const [milestones, setMilestones] = useState<MilestoneForm[]>([
    { title: "", description: "", amount: "" },
  ]);

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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-theme-heading mb-2">Post a Job</h1>
      <p className="text-theme-text mb-8">
        Describe your project and set milestones. Funds will be locked in escrow
        when a freelancer is accepted.
      </p>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-theme-heading mb-2">
            Job Title
          </label>
          <input
            type="text"
            placeholder="e.g., Build Soroban DEX Frontend"
            className="input-field"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-theme-heading mb-2">
            Description
          </label>
          <textarea
            rows={6}
            placeholder="Describe the project requirements, scope, and deliverables..."
            className="input-field resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-theme-heading mb-2">
            Category
          </label>
          <select className="input-field">
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
        <button type="submit" className="btn-primary w-full text-lg">
          Post Job & Fund Escrow
        </button>
      </form>
    </div>
  );
}
