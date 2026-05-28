import React from "react";
import { render, screen } from "@testing-library/react";
import ProposeRevisionModal, {
  ProposeRevisionMilestoneInput,
} from "../ProposeRevisionModal";

const noop = async () => {};

const current: ProposeRevisionMilestoneInput[] = [
  { title: "Design", amount: 100, deadline: "2026-07-01" },
  { title: "Backend", amount: 200, deadline: "2026-08-01" },
];

function openModal(
  initialRows: ProposeRevisionMilestoneInput[],
  currentMilestones: ProposeRevisionMilestoneInput[] = []
) {
  return render(
    <ProposeRevisionModal
      isOpen
      onClose={noop}
      onSubmit={noop}
      initialRows={initialRows}
      currentMilestones={currentMilestones}
      processing={false}
    />
  );
}

describe("ProposeRevisionModal diff view", () => {
  test("shows no diff section when currentMilestones is empty", () => {
    openModal(current);
    expect(screen.queryByRole("region", { name: /milestone changes/i })).toBeNull();
  });

  test("shows no diff section when milestone list is identical", () => {
    openModal(current, current);
    expect(screen.queryByRole("region", { name: /milestone changes/i })).toBeNull();
  });

  test("highlights added milestone in green", () => {
    const proposed: ProposeRevisionMilestoneInput[] = [
      ...current,
      { title: "Testing", amount: 50, deadline: "2026-09-01" },
    ];
    openModal(proposed, current);
    expect(
      screen.getByRole("listitem", { name: /added milestone: Testing/i })
    ).toBeInTheDocument();
  });

  test("highlights removed milestone with strikethrough", () => {
    const proposed: ProposeRevisionMilestoneInput[] = [
      { title: "Design", amount: 100, deadline: "2026-07-01" },
    ];
    openModal(proposed, current);
    expect(
      screen.getByRole("listitem", { name: /removed milestone: Backend/i })
    ).toBeInTheDocument();
  });

  test("highlights repriced milestone", () => {
    const proposed: ProposeRevisionMilestoneInput[] = [
      { title: "Design", amount: 150, deadline: "2026-07-01" },
      { title: "Backend", amount: 200, deadline: "2026-08-01" },
    ];
    openModal(proposed, current);
    expect(
      screen.getByRole("listitem", { name: /changed milestone: Design/i })
    ).toBeInTheDocument();
  });

  test("highlights deadline-only change", () => {
    const proposed: ProposeRevisionMilestoneInput[] = [
      { title: "Design", amount: 100, deadline: "2026-07-15" },
      { title: "Backend", amount: 200, deadline: "2026-08-01" },
    ];
    openModal(proposed, current);
    expect(
      screen.getByRole("listitem", { name: /changed milestone: Design/i })
    ).toBeInTheDocument();
  });
});
