import type { Meta, StoryObj } from "@storybook/react";
import DisputeTimeline from "./DisputeTimeline";

const meta: Meta<typeof DisputeTimeline> = {
  title: "Components/DisputeTimeline",
  component: DisputeTimeline,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DisputeTimeline>;

export const Default: Story = {
  args: {
    isLive: true,
    events: [
      {
        id: 1,
        disputeId: "dispute-1",
        type: "DISPUTE_OPENED",
        payload: { initiatorUsername: "Client" },
        createdAt: "2026-05-27T12:00:00Z",
      },
      {
        id: 2,
        disputeId: "dispute-1",
        type: "EVIDENCE_SUBMITTED",
        payload: { fileCount: 2 },
        createdAt: "2026-05-27T15:30:00Z",
      },
      {
        id: 3,
        disputeId: "dispute-1",
        type: "VOTE_CAST",
        payload: { voteCount: 1 },
        createdAt: "2026-05-28T09:15:00Z",
      },
    ],
  },
};
