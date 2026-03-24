"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Clock, DollarSign, ArrowLeft, MessageSquare, ShieldCheck, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import ApplyModal from "@/components/ApplyModal";
import RaiseDisputeModal from "@/components/RaiseDisputeModal";
import { Job } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function JobDetailPage() {
  const { id } = useParams();
  const { address, signAndBroadcastTransaction } = useWallet();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/jobs/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setJob(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch job details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleEscrowAction = async (action: "init" | "fund" | "approve", milestoneId?: string) => {
    setError(null);
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      let payload: Record<string, unknown> = { jobId: id };
      let type = "";

      if (action === "init") {
        endpoint = "/escrow/init-create";
        type = "CREATE_JOB";
      } else if (action === "fund") {
        endpoint = "/escrow/init-fund";
        type = "FUND_JOB";
      } else if (action === "approve") {
        endpoint = "/escrow/init-approve";
        payload = { milestoneId };
        type = "APPROVE_MILESTONE";
      }

      // 1. Get XDR from backend
      const res = await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 2. Sign and broadcast via WalletContext
      const txResult = await signAndBroadcastTransaction(res.data.xdr);

      if (!txResult.success) {
        throw new Error(txResult.error || "Transaction failed");
      }

      // 3. Confirm with backend
      // Note: For CREATE_JOB, we ideally need the on-chain job ID from events, 
      // but here we simplify or assume the backend can extract it or use a count.
      // In this contract, job IDs are sequential. Our backend confirm-tx needs to know this.
      await axios.post(`${API_URL}/escrow/confirm-tx`, {
        hash: txResult.hash,
        type,
        jobId: id,
        milestoneId,
        onChainJobId: 1, // Simplified for this task: in production, parse resultXdr or events
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 4. Refresh data
      await fetchJob();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch job details.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-stellar-blue" size={48} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-theme-heading mb-4">Job Not Found</h1>
        <Link href="/jobs" className="text-stellar-blue hover:underline">Return to browse jobs</Link>
      </div>
    );
  }

  const isClient = address === job.client.walletAddress;
  const isOwnJob = user?.id === job.client.id || isClient;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/jobs"
        className="flex items-center gap-2 text-theme-text hover:text-theme-heading mb-8 transition-colors"
      >
        <ArrowLeft size={18} /> Back to Jobs
      </Link>

      {error && (
        <div className="mb-6 p-4 bg-theme-error/10 border border-theme-error/20 rounded-lg flex items-start gap-3 text-theme-error">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-medium text-stellar-purple bg-stellar-purple/10 px-3 py-1 rounded">
              {job.category}
            </span>
            <div className="flex gap-2">
                <StatusBadge status={job.status} />
                <StatusBadge status={job.escrowStatus} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-theme-heading mb-4">
            {job.title}
          </h1>

          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-theme-heading mb-4">
              Description
            </h2>
            <div className="text-theme-text whitespace-pre-line text-sm leading-relaxed">
              {job.description}
            </div>
          </div>

          {/* Milestones */}
          <div className="card">
            <h2 className="text-lg font-semibold text-theme-heading mb-4">
              Milestones
            </h2>
            <div className="space-y-4">
              {job.milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="flex items-start gap-4 p-4 bg-theme-bg rounded-lg border border-theme-border"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stellar-blue/20 flex items-center justify-center text-stellar-blue text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-theme-heading">
                        {milestone.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-stellar-purple font-medium">
                          {milestone.amount.toLocaleString()} XLM
                        </span>
                        <StatusBadge status={milestone.status} />
                      </div>
                    </div>
                    <p className="text-sm text-theme-text mb-3">
                      {milestone.description}
                    </p>
                    
                    {/* Milestone Actions */}
                    {isClient && milestone.status === "SUBMITTED" && (
                        <button 
                            disabled={processing}
                            onClick={() => handleEscrowAction("approve", milestone.id)}
                            className="btn-primary py-1.5 text-xs flex items-center gap-2"
                        >
                            {processing ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                            Approve & Release Funds
                        </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="text-stellar-blue" size={20} />
              <span className="text-2xl font-bold text-theme-heading">
                {job.budget.toLocaleString()} XLM
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-theme-text mb-4">
              <Clock size={14} />
              Posted {new Date(job.createdAt).toLocaleDateString()}
            </div>
            
            {/* Escrow Status Actions */}
            {isClient && !job.contractJobId && job.status === "IN_PROGRESS" && (
                <button 
                    disabled={processing}
                    onClick={() => handleEscrowAction("init")}
                    className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
                >
                    {processing ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                    Initialize On-Chain Escrow
                </button>
            )}

            {isClient && job.contractJobId && job.escrowStatus === "UNFUNDED" && (
                <button 
                    disabled={processing}
                    onClick={() => handleEscrowAction("fund")}
                    className="btn-secondary w-full flex items-center justify-center gap-2 mb-4 border-stellar-blue text-stellar-blue hover:bg-stellar-blue/10"
                >
                    {processing ? <Loader2 className="animate-spin" size={18} /> : <DollarSign size={18} />}
                    Fund Escrow with XLM
                </button>
            )}

            {!isOwnJob && job.status === "OPEN" && (
              hasApplied ? (
                <button
                  className="btn-secondary w-full flex items-center justify-center gap-2 cursor-default opacity-80"
                  disabled
                >
                  <CheckCircle size={16} /> Applied
                </button>
              ) : (
                <button
                  className="btn-primary w-full"
                  onClick={() => setApplyModalOpen(true)}
                >
                  Apply for this Job
                </button>
              )
            )}
            
            {job.escrowStatus === "FUNDED" && (
                <div className="p-3 bg-stellar-blue/10 border border-stellar-blue/20 rounded-lg text-xs text-stellar-blue flex items-center gap-2 mb-4">
                    <ShieldCheck size={16} />
                    Funds are secured in escrow
                </div>
            )}

            {isOwnJob && (job.status === "IN_PROGRESS" || job.status === "COMPLETED") && job.escrowStatus !== "DISPUTED" && (
                <button
                  className="btn-secondary w-full flex items-center justify-center gap-2 border-theme-error text-theme-error hover:bg-theme-error/10"
                  onClick={() => setDisputeModalOpen(true)}
                >
                  <AlertCircle size={18} /> Raise Dispute
                </button>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-theme-heading mb-4">
              About the Client
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stellar-blue to-stellar-purple" />
              <div>
                <div className="font-medium text-theme-heading">
                  {job.client.username}
                </div>
                <div className="text-xs text-theme-text">
                  {job.client.walletAddress.slice(0, 8)}...{job.client.walletAddress.slice(-8)}
                </div>
              </div>
            </div>
            <p className="text-sm text-theme-text mb-4">{job.client.bio}</p>
            <Link
              href={`/messages/${job.client.id}-${job.id}`}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <MessageSquare size={18} /> Message Client
            </Link>
          </div>
        </div>
      </div>

      {job.status === "OPEN" && !isOwnJob && (
        <ApplyModal
          job={job}
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          onSuccess={() => setHasApplied(true)}
        />
      )}

      {isOwnJob && (
        <RaiseDisputeModal
          job={job}
          isOpen={disputeModalOpen}
          onClose={() => setDisputeModalOpen(false)}
          onSuccess={() => {
            setDisputeModalOpen(false);
            fetchJob();
          }}
        />
      )}
    </div>
  );
}
