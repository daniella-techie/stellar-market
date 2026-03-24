"use client";

import { useState } from "react";
import { Briefcase, FileText, MessageSquare, Star } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const stats = [
  { label: "Active Jobs", value: "3", icon: Briefcase, color: "text-stellar-blue" },
  { label: "Pending Apps", value: "5", icon: FileText, color: "text-yellow-400" },
  { label: "Earnings", value: "12,500 XLM", icon: Star, color: "text-stellar-purple" },
  { label: "Rating", value: "4.8/5", icon: Star, color: "text-green-400" },
];

const activeJobs = [
  { id: "1", title: "Build Soroban DEX Frontend", client: "stellarbuilder", status: "IN_PROGRESS", budget: 5000, deadline: "2025-03-01" },
  { id: "2", title: "Smart Contract Audit", client: "defiteam", status: "IN_PROGRESS", budget: 8000, deadline: "2025-02-20" },
  { id: "3", title: "Mobile App for Payments", client: "mobilestellar", status: "OPEN", budget: 12000, deadline: "2025-04-01" },
];

const applications = [
  { id: "1", job: "Governance Module for DAO", status: "PENDING", appliedAt: "2025-01-12" },
  { id: "2", job: "Data Analytics Dashboard", status: "ACCEPTED", appliedAt: "2025-01-10" },
  { id: "3", job: "Technical Docs Writer", status: "REJECTED", appliedAt: "2025-01-08" },
  { id: "4", job: "Brand Identity Design", status: "PENDING", appliedAt: "2025-01-14" },
  { id: "5", job: "NFT Marketplace Backend", status: "PENDING", appliedAt: "2025-01-13" },
];

const tabs = ["Active Jobs", "Applications", "Messages"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Active Jobs");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-theme-heading mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4">
            <div className={`${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-theme-heading">
                {stat.value}
              </div>
              <div className="text-sm text-theme-text">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-theme-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "text-stellar-blue border-stellar-blue"
                : "text-theme-text border-transparent hover:text-theme-heading"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Active Jobs" && (
        <div className="space-y-4">
          {activeJobs.map((job) => (
            <div key={job.id} className="card flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-theme-heading">{job.title}</h3>
                <p className="text-sm text-theme-text">
                  Client: {job.client} &middot; Deadline: {job.deadline}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-stellar-purple">
                  {job.budget.toLocaleString()} XLM
                </span>
                <StatusBadge status={job.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Applications" && (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="card flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-theme-heading">{app.job}</h3>
                <p className="text-sm text-theme-text">
                  Applied: {app.appliedAt}
                </p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      )}

      {activeTab === "Messages" && (
        <div className="card text-center py-12">
          <MessageSquare className="mx-auto text-theme-text mb-4" size={40} />
          <h3 className="text-lg font-semibold text-theme-heading mb-2">
            No messages yet
          </h3>
          <p className="text-theme-text">
            Messages from clients and freelancers will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
