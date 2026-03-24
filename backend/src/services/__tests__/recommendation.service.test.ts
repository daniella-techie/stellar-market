import {
  jaccardSimilarity,
  categoryAffinityScore,
  recencyScore,
  reputationScore,
  computeRelevanceScore,
} from "../recommendation.service";

// ─── Jaccard Similarity ──────────────────────────────────────────────────────

describe("jaccardSimilarity", () => {
  it("returns 1 for identical skill sets", () => {
    expect(jaccardSimilarity(["React", "Node.js"], ["React", "Node.js"])).toBe(1);
  });

  it("returns 0 for completely disjoint sets", () => {
    expect(jaccardSimilarity(["React", "Vue"], ["Python", "Django"])).toBe(0);
  });

  it("returns 0 when both sets are empty", () => {
    expect(jaccardSimilarity([], [])).toBe(0);
  });

  it("returns 0 when one set is empty", () => {
    expect(jaccardSimilarity(["React"], [])).toBe(0);
  });

  it("computes correct similarity for partial overlap", () => {
    // A = {react, node.js}, B = {react, python}
    // Intersection = {react} = 1, Union = {react, node.js, python} = 3
    // J = 1/3 ≈ 0.333
    const result = jaccardSimilarity(["React", "Node.js"], ["React", "Python"]);
    expect(result).toBeCloseTo(1 / 3, 5);
  });

  it("is case-insensitive", () => {
    expect(jaccardSimilarity(["REACT", "node.js"], ["react", "NODE.JS"])).toBe(1);
  });

  it("handles duplicates in input by deduplicating via Set", () => {
    // Both reduce to {react, node.js}
    expect(
      jaccardSimilarity(["React", "React", "Node.js"], ["React", "Node.js"])
    ).toBe(1);
  });

  it("computes known example: ['js','ts'] vs ['js','react'] = 1/3", () => {
    const result = jaccardSimilarity(["js", "ts"], ["js", "react"]);
    expect(result).toBeCloseTo(1 / 3, 5);
  });
});

// ─── Category Affinity ───────────────────────────────────────────────────────

describe("categoryAffinityScore", () => {
  it("returns 1 when job category matches a completed category", () => {
    expect(categoryAffinityScore("Development", ["Development", "Design"])).toBe(1);
  });

  it("returns 0 when job category has no match", () => {
    expect(categoryAffinityScore("Marketing", ["Development", "Design"])).toBe(0);
  });

  it("is case-insensitive", () => {
    expect(categoryAffinityScore("DEVELOPMENT", ["development"])).toBe(1);
  });

  it("returns 0 when completed categories is empty", () => {
    expect(categoryAffinityScore("Development", [])).toBe(0);
  });
});

// ─── Recency Score ───────────────────────────────────────────────────────────

describe("recencyScore", () => {
  const now = new Date("2026-02-26T00:00:00Z");

  it("returns 1 for a job posted right now", () => {
    expect(recencyScore(now, now)).toBe(1);
  });

  it("returns ~0.5 for a job posted 15 days ago", () => {
    const fifteenDaysAgo = new Date("2026-02-11T00:00:00Z");
    expect(recencyScore(fifteenDaysAgo, now)).toBeCloseTo(0.5, 1);
  });

  it("returns 0 for a job posted 30+ days ago", () => {
    const thirtyDaysAgo = new Date("2026-01-27T00:00:00Z");
    expect(recencyScore(thirtyDaysAgo, now)).toBe(0);
  });

  it("returns 0 for a very old job", () => {
    const veryOld = new Date("2025-01-01T00:00:00Z");
    expect(recencyScore(veryOld, now)).toBe(0);
  });
});

// ─── Reputation Score ────────────────────────────────────────────────────────

describe("reputationScore", () => {
  it("returns 1 for a perfect 5.0 rating", () => {
    expect(reputationScore(5)).toBe(1);
  });

  it("returns 0.6 for a 3.0 rating", () => {
    expect(reputationScore(3)).toBeCloseTo(0.6, 5);
  });

  it("returns 0 for no rating (0)", () => {
    expect(reputationScore(0)).toBe(0);
  });

  it("clamps to 1 for ratings above 5", () => {
    expect(reputationScore(6)).toBe(1);
  });

  it("clamps to 0 for negative ratings", () => {
    expect(reputationScore(-1)).toBe(0);
  });
});

// ─── Combined Relevance Score ────────────────────────────────────────────────

describe("computeRelevanceScore", () => {
  const now = new Date("2026-02-26T00:00:00Z");

  it("returns 0 when there is no overlap and no affinity", () => {
    const score = computeRelevanceScore({
      freelancerSkills: ["React"],
      jobSkills: ["Python"],
      jobCategory: "Data Science",
      completedCategories: ["Development"],
      jobCreatedAt: new Date("2025-01-01T00:00:00Z"), // very old
      clientAverageRating: 0,
      now,
    });
    expect(score).toBe(0);
  });

  it("returns max score for perfect match on all dimensions", () => {
    const score = computeRelevanceScore({
      freelancerSkills: ["React", "Node.js"],
      jobSkills: ["React", "Node.js"],
      jobCategory: "Development",
      completedCategories: ["Development"],
      jobCreatedAt: now, // just posted
      clientAverageRating: 5,
      now,
    });
    // 0.5 * 1 + 0.25 * 1 + 0.15 * 1 + 0.1 * 1 = 1.0
    expect(score).toBeCloseTo(1.0, 5);
  });

  it("correctly weights partial skill overlap", () => {
    const score = computeRelevanceScore({
      freelancerSkills: ["React", "Node.js"],
      jobSkills: ["React", "Python"],
      jobCategory: "Other",
      completedCategories: [],
      jobCreatedAt: new Date("2025-01-01T00:00:00Z"), // old
      clientAverageRating: 0,
      now,
    });
    // Only skill overlap contributes: 0.5 * (1/3) ≈ 0.1667
    expect(score).toBeCloseTo(0.5 * (1 / 3), 4);
  });

  it("boosts score for matching category", () => {
    const withoutCategory = computeRelevanceScore({
      freelancerSkills: [],
      jobSkills: [],
      jobCategory: "Development",
      completedCategories: [],
      jobCreatedAt: new Date("2025-01-01T00:00:00Z"),
      clientAverageRating: 0,
      now,
    });

    const withCategory = computeRelevanceScore({
      freelancerSkills: [],
      jobSkills: [],
      jobCategory: "Development",
      completedCategories: ["Development"],
      jobCreatedAt: new Date("2025-01-01T00:00:00Z"),
      clientAverageRating: 0,
      now,
    });

    expect(withCategory).toBeGreaterThan(withoutCategory);
    expect(withCategory - withoutCategory).toBeCloseTo(0.25, 5);
  });
});
