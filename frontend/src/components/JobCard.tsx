import Link from "next/link";
import { Clock, DollarSign, Users } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { Job } from "@/types";

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="card hover:border-stellar-blue/50 transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-stellar-purple bg-stellar-purple/10 px-2 py-1 rounded">
            {job.category}
          </span>
          <StatusBadge status={job.status} />
        </div>

        <h3 className="text-lg font-semibold text-theme-heading mb-2">
          {job.title}
        </h3>

        <p className="text-sm text-theme-text mb-4 line-clamp-2">
          {job.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-theme-text">
          <div className="flex items-center gap-1">
            <DollarSign size={14} />
            <span>{job.budget.toLocaleString()} XLM</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{job._count?.applications || 0} applicants</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-theme-border">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-stellar-blue to-stellar-purple" />
          <span className="text-sm text-theme-text">{job.client.username}</span>
        </div>
      </div>
    </Link>
  );
}
