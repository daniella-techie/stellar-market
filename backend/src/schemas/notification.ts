import { z } from "zod";
import { paginationSchema } from "./common";

export const getNotificationsQuerySchema = paginationSchema;

export const getNotificationByIdParamSchema = z.object({
  id: z.string().cuid(),
});
