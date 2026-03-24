import { z } from "zod";
import {
  emailSchema,
  optionalStellarAddressSchema,
  paginationSchema,
} from "./common";

export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  email: emailSchema.optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  skills: z
    .array(z.string())
    .max(10, "Cannot have more than 10 skills")
    .optional(),
  stellarAddress: optionalStellarAddressSchema,
  availability: z.boolean().optional(),
});

export const getUsersQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  skill: z.string().optional(),
});

export const getUserJobsQuerySchema = paginationSchema;

export const getUserByIdParamSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});
