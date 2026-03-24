import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { asyncHandler } from "../middleware/error";
import { NotificationService } from "../services/notification.service";
import { getNotificationsQuerySchema, getNotificationByIdParamSchema } from "../schemas";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Real-time notification endpoints
 */

// Get paginated notifications for the current user
router.get(
    "/",
    authenticate,
    validate({ query: getNotificationsQuerySchema }),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { page, limit } = req.query as any;
        const result = await NotificationService.getNotifications(req.userId!, page, limit);
        res.json(result);
    })
);

// Get unread notification count
router.get(
    "/unread-count",
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const count = await NotificationService.getUnreadCount(req.userId!);
        res.json({ count });
    })
);

// Mark a single notification as read
router.put(
    "/:id/read",
    authenticate,
    validate({ params: getNotificationByIdParamSchema }),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = req.params.id as string;
        await NotificationService.markAsRead(id, req.userId!);
        res.status(204).send();
    })
);

// Mark all notifications as read
router.put(
    "/read-all",
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        await NotificationService.markAllAsRead(req.userId!);
        res.status(204).send();
    })
);

export default router;
