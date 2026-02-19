import { describe, expect, it } from "vitest";
import { calculateProgressivePollingInterval } from "../helpers/progressive-polling";

describe("calculateProgressivePollingInterval", () => {
  it("stops polling on terminal statuses", () => {
    expect(
      calculateProgressivePollingInterval({
        orderStatus: "filled",
        dataUpdatedAt: 1000,
        now: 2000,
      }),
    ).toBe(false);
    expect(
      calculateProgressivePollingInterval({
        orderStatus: "refunded",
        dataUpdatedAt: 1000,
        now: 2000,
      }),
    ).toBe(false);
    expect(
      calculateProgressivePollingInterval({
        orderStatus: "failed",
        dataUpdatedAt: 1000,
        now: 2000,
      }),
    ).toBe(false);
  });

  it("uses the fastest interval before first successful fetch", () => {
    expect(
      calculateProgressivePollingInterval({
        orderStatus: "created",
        dataUpdatedAt: 0,
        now: 1000,
      }),
    ).toBe(1000);
  });

  it("uses progressive interval tiers by elapsed time", () => {
    const now = 200_000;

    expect(
      calculateProgressivePollingInterval({
        orderStatus: "created",
        dataUpdatedAt: now - 5_000,
        now,
      }),
    ).toBe(1000);

    expect(
      calculateProgressivePollingInterval({
        orderStatus: "deposited",
        dataUpdatedAt: now - 20_000,
        now,
      }),
    ).toBe(2000);

    expect(
      calculateProgressivePollingInterval({
        orderStatus: "published",
        dataUpdatedAt: now - 45_000,
        now,
      }),
    ).toBe(3000);

    expect(
      calculateProgressivePollingInterval({
        orderStatus: "refund_pending",
        dataUpdatedAt: now - 90_000,
        now,
      }),
    ).toBe(5000);

    expect(
      calculateProgressivePollingInterval({
        orderStatus: "published",
        dataUpdatedAt: now - 130_000,
        now,
      }),
    ).toBe(10000);
  });
});
