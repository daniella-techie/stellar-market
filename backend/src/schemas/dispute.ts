import { z } from "zod";

export const raiseDisputeSchema = z.object({
  jobId: z.string().cuid({ message: "Invalid job ID format" }),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters long" }),
  minVotes: z.number().int().min(3).optional().default(3),
});

export const castVoteSchema = z.object({
  disputeId: z.string().cuid({ message: "Invalid dispute ID format" }),
  choice: z.enum(["CLIENT", "FREELANCER"], { 
    message: "Choice must be either CLIENT or FREELANCER" 
  }),
  reason: z.string().min(10, { message: "Please provide a reason for your vote" }),
});

export const resolveDisputeSchema = z.object({
  disputeId: z.string().cuid({ message: "Invalid dispute ID format" }),
});

export const excludeVoterSchema = z.object({
  disputeId: z.string().cuid({ message: "Invalid dispute ID format" }),
  voterWallet: z.string().min(56).max(56, { message: "Invalid Stellar address" }),
});
