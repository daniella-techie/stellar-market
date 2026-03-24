import { z } from "zod";
import { paginationSchema, reviewRatingSchema } from "./common";

export const createReviewSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
  revieweeId: z.string().uuid("Invalid reviewee ID"),
  rating: reviewRatingSchema,
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters long")
    .max(1000, "Comment must be less than 1000 characters"),
});

export const updateReviewSchema = z.object({
  rating: reviewRatingSchema.optional(),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters long")
    .max(1000, "Comment must be less than 1000 characters")
    .optional(),
});

export const getReviewsQuerySchema = paginationSchema.extend({
  jobId: z.string().uuid().optional(),
  reviewerId: z.string().uuid().optional(),
  revieweeId: z.string().uuid().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export const getReviewByIdParamSchema = z.object({
  id: z.string().uuid(),
});
