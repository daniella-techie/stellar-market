import { Router, Request, Response } from "express";
import { PrismaClient, JobStatus, DisputeStatus } from "@prisma/client";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import { ContractService } from "../services/contract.service";
import { raiseDisputeSchema, castVoteSchema, resolveDisputeSchema } from "../schemas/dispute";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Get all disputes (for community voters)
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const disputes = await prisma.dispute.findMany({
    include: {
      job: { select: { title: true, budget: true } },
      initiator: { select: { username: true, walletAddress: true, avatarUrl: true } },
      respondent: { select: { username: true, walletAddress: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(disputes);
}));

// Get specific dispute details
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: req.params.id as string },
    include: {
      job: { include: { client: true, freelancer: true } },
      initiator: { select: { username: true, walletAddress: true, id: true, avatarUrl: true } },
      respondent: { select: { username: true, walletAddress: true, id: true, avatarUrl: true } },
      votes: { include: { voter: { select: { username: true, walletAddress: true, avatarUrl: true } } } },
      attachments: true,
    },
  });

  if (!dispute) return res.status(404).json({ error: "Dispute not found" });
  res.json(dispute);
}));

// Request XDR to raise a dispute
router.post("/init-raise", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = raiseDisputeSchema.parse(req.body);
  const job = await prisma.job.findUnique({
    where: { id: data.jobId },
    include: { client: true, freelancer: true },
  });

  if (!job || !job.freelancer) {
    return res.status(404).json({ error: "Job with assigned freelancer not found." });
  }

  if (job.clientId !== req.userId && job.freelancerId !== req.userId) {
    return res.status(403).json({ error: "Only job participants can raise a dispute." });
  }

  if (!job.contractJobId) {
    return res.status(400).json({ error: "Job isn't initialized on-chain yet." });
  }

  // Determine initiator and respondent
  const isClient = job.clientId === req.userId;
  const initiator = isClient ? job.client : job.freelancer;
  const respondent = isClient ? job.freelancer : job.client;

  const xdr = await ContractService.buildRaiseDisputeTx(
    initiator.walletAddress,
    parseInt(job.contractJobId),
    job.client.walletAddress,
    job.freelancer.walletAddress,
    data.reason,
    data.minVotes
  );

  res.json({ xdr, respondentId: respondent.id });
}));

// Request XDR to cast a vote
router.post("/init-vote", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = castVoteSchema.parse(req.body);
  const dispute = await prisma.dispute.findUnique({
    where: { id: data.disputeId },
  });

  if (!dispute || !dispute.contractDisputeId) {
    return res.status(404).json({ error: "On-chain dispute not found." });
  }

  const voter = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!voter) return res.status(404).json({ error: "User not found" });

  const choiceEnum = data.choice === "CLIENT" ? 0 : 1;
  const xdr = await ContractService.buildCastVoteTx(
    voter.walletAddress,
    parseInt(dispute.contractDisputeId),
    choiceEnum,
    data.reason
  );

  res.json({ xdr });
}));

// Request XDR to resolve dispute 
router.post("/init-resolve", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = resolveDisputeSchema.parse(req.body);
  const dispute = await prisma.dispute.findUnique({
    where: { id: data.disputeId }
  });

  if (!dispute || !dispute.contractDisputeId) {
    return res.status(404).json({ error: "On-chain dispute not found." });
  }

  const caller = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!caller) return res.status(404).json({ error: "User not found" });

  const xdr = await ContractService.buildResolveDisputeTx(
    caller.walletAddress,
    parseInt(dispute.contractDisputeId)
  );

  res.json({ xdr });
}));

// Confirm transaction and update local database
router.post("/confirm-tx", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    hash: z.string(),
    type: z.enum(["RAISE_DISPUTE", "CAST_VOTE", "RESOLVE_DISPUTE"]),
    jobId: z.string().optional(),
    disputeId: z.string().optional(),
    onChainDisputeId: z.number().optional(),
    reason: z.string().optional(),
    choice: z.string().optional(),
    respondentId: z.string().optional(),
  });

  const data = schema.parse(req.body);
  const verification = await ContractService.verifyTransaction(data.hash);
  
  if (!verification.success) {
    return res.status(400).json({ error: `Transaction failed or not found: ${verification.error}` });
  }

  if (data.type === "RAISE_DISPUTE" && data.jobId && data.onChainDisputeId && data.respondentId && data.reason) {
    const dispute = await prisma.dispute.create({
      data: {
        jobId: data.jobId,
        contractDisputeId: data.onChainDisputeId.toString(),
        initiatorId: req.userId!,
        respondentId: data.respondentId,
        reason: data.reason,
        status: DisputeStatus.OPEN,
      }
    });
    
    await prisma.job.update({
      where: { id: data.jobId },
      data: { 
        status: JobStatus.DISPUTED,
        escrowStatus: "DISPUTED" 
      }
    });
    return res.json({ message: "Dispute raised successfully", dispute });
  } 
  
  else if (data.type === "CAST_VOTE" && data.disputeId && data.choice && data.reason) {
    const vote = await prisma.vote.create({
      data: {
        disputeId: data.disputeId,
        voterId: req.userId!,
        choice: data.choice,
        reason: data.reason
      }
    });

    const isClient = data.choice === "CLIENT";
    await prisma.dispute.update({
      where: { id: data.disputeId },
      data: {
        votesForClient: isClient ? { increment: 1 } : undefined,
        votesForFreelancer: !isClient ? { increment: 1 } : undefined,
        status: DisputeStatus.VOTING
      }
    });
    return res.json({ message: "Vote cast successfully", vote });
  }

  else if (data.type === "RESOLVE_DISPUTE" && data.disputeId) {
    const dispute = await prisma.dispute.findUnique({ where: { id: data.disputeId } });
    if (!dispute) return res.status(404).json({ error: "Dispute not found" });

    const resolvedStatus = dispute.votesForClient >= dispute.votesForFreelancer 
      ? DisputeStatus.RESOLVED_CLIENT 
      : DisputeStatus.RESOLVED_FREELANCER;

    await prisma.dispute.update({
      where: { id: data.disputeId },
      data: { status: resolvedStatus }
    });

    // We also mark the job back to COMPLETED or leave it as DISPUTED but resolved?
    // Let's mark it as COMPLETED since the contract releases funds.
    await prisma.job.update({
      where: { id: dispute.jobId },
      data: { status: JobStatus.COMPLETED, escrowStatus: "COMPLETED" }
    });

    return res.json({ message: "Dispute resolved successfully", status: resolvedStatus });
  }

  res.status(400).json({ error: "Invalid confirmation parameters" });
}));

export default router;
