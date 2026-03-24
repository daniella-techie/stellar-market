import request from "supertest";
import express from "express";
import adminRoutes from "../admin";
import { UserRole, DisputeStatus } from "@prisma/client";

// Mock Prisma
jest.mock("@prisma/client", () => {
    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        },
        job: {
            findUnique: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        },
        dispute: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        notification: {
            create: jest.fn(),
        }
    };

    return {
        PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
        __mockPrisma: mockPrisma,
        UserRole: {
            ADMIN: "ADMIN",
            CLIENT: "CLIENT",
            FREELANCER: "FREELANCER",
        },
        DisputeStatus: {
            PENDING: "PENDING",
            REVIEWING: "REVIEWING",
            RESOLVED_FOR_CLIENT: "RESOLVED_FOR_CLIENT",
            RESOLVED_FOR_FREELANCER: "RESOLVED_FOR_FREELANCER",
            OVERRIDDEN_BY_ADMIN: "OVERRIDDEN_BY_ADMIN",
        }
    };
});

// Mock auth middleware to provide an ADMIN user
jest.mock("../../middleware/auth", () => ({
    requireAdmin: jest.fn((req, res, next) => {
        req.userId = "admin123";
        req.userRole = "ADMIN";
        next();
    }),
}));

// Mock Socket.io
jest.mock("../../socket", () => ({
    getIo: jest.fn(() => ({
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
    })),
}));

const { __mockPrisma: mockPrisma } = jest.requireMock("@prisma/client") as any;

const app = express();
app.use(express.json());
app.use("/api/admin", adminRoutes);

describe("Admin Routes Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/admin/users", () => {
        it("should list users with default pagination", async () => {
            mockPrisma.user.findMany.mockResolvedValue([{ id: "u1", username: "user1" }]);
            mockPrisma.user.count.mockResolvedValue(1);

            const response = await request(app).get("/api/admin/users");

            expect(response.status).toBe(200);
            expect(response.body.users).toHaveLength(1);
            expect(response.body.pagination.total).toBe(1);
        });

        it("should filter users by role", async () => {
            mockPrisma.user.findMany.mockResolvedValue([]);
            mockPrisma.user.count.mockResolvedValue(0);

            await request(app).get("/api/admin/users").query({ role: "CLIENT" });

            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ role: "CLIENT" })
                })
            );
        });
    });

    describe("PATCH /api/admin/users/:id/suspend", () => {
        it("should suspend a user and create an audit log", async () => {
            const mockUser = { id: "u1", username: "baduser" };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.user.update.mockResolvedValue({ ...mockUser, isSuspended: true });

            const response = await request(app)
                .patch("/api/admin/users/u1/suspend")
                .send({ isSuspended: true, suspendReason: "Violation" });

            expect(response.status).toBe(200);
            expect(mockPrisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: "u1" },
                    data: expect.objectContaining({ isSuspended: true })
                })
            );
            expect(mockPrisma.auditLog.create).toHaveBeenCalled();
        });
    });

    describe("DELETE /api/admin/jobs/:id", () => {
        it("should remove a job and notify the owner", async () => {
            const mockJob = { id: "j1", title: "Fake Job", clientId: "c1" };
            mockPrisma.job.findUnique.mockResolvedValue(mockJob);

            const response = await request(app).delete("/api/admin/jobs/j1");

            expect(response.status).toBe(200);
            expect(mockPrisma.job.delete).toHaveBeenCalledWith({ where: { id: "j1" } });
            // Should create notification record
            expect(mockPrisma.notification.create).toHaveBeenCalled();
            // Should create audit log
            expect(mockPrisma.auditLog.create).toHaveBeenCalled();
        });
    });

    describe("GET /api/admin/disputes", () => {
        it("should list all disputes", async () => {
            mockPrisma.dispute.findMany.mockResolvedValue([{ id: "d1", reason: "Late" }]);

            const response = await request(app).get("/api/admin/disputes");

            expect(response.status).toBe(200);
            expect(response.body.disputes).toHaveLength(1);
        });
    });

    describe("PATCH /api/admin/disputes/:id/override", () => {
        it("should override dispute outcome", async () => {
            mockPrisma.dispute.findUnique.mockResolvedValue({ id: "d1" });
            mockPrisma.dispute.update.mockResolvedValue({ id: "d1", status: "OVERRIDDEN_BY_ADMIN" });

            const response = await request(app)
                .patch("/api/admin/disputes/d1/override")
                .send({ outcome: "Refund client", status: "RESOLVED_FOR_CLIENT" });

            expect(response.status).toBe(200);
            expect(mockPrisma.dispute.update).toHaveBeenCalled();
            expect(mockPrisma.auditLog.create).toHaveBeenCalled();
        });
    });

    describe("GET /api/admin/audit-log", () => {
        it("should return paginated audit logs", async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue([{ id: "l1", action: "DELETE_JOB" }]);
            mockPrisma.auditLog.count.mockResolvedValue(1);

            const response = await request(app).get("/api/admin/audit-log");

            expect(response.status).toBe(200);
            expect(response.body.logs).toHaveLength(1);
        });
    });
});
