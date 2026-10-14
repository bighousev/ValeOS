import { describe, expect, it } from "vitest";
import { completeWeekWindows, latestWonEvents } from "./reporting";

describe("dashboard period", () => {
  it("uses the seven complete Sao Paulo days, excluding today", () => {
    const windows = completeWeekWindows(new Date("2026-10-14T15:00:00Z"));
    expect(windows.current).toEqual({
      start: "2026-10-07T03:00:00.000Z",
      end: "2026-10-14T03:00:00.000Z",
    });
    expect(windows.previous).toEqual({
      start: "2026-09-30T03:00:00.000Z",
      end: "2026-10-07T03:00:00.000Z",
    });
  });
  it("counts only the last valid gain after reopening", () => {
    const events = [
      {
        opportunity_id: "a",
        to_stage: "Ganho",
        confirmed_value: 100,
        occurred_at: "2026-10-08T04:00:00Z",
      },
      {
        opportunity_id: "a",
        to_stage: "Em contato",
        confirmed_value: null,
        occurred_at: "2026-10-09T04:00:00Z",
      },
      {
        opportunity_id: "a",
        to_stage: "Ganho",
        confirmed_value: 120,
        occurred_at: "2026-10-10T04:00:00Z",
      },
      {
        opportunity_id: "b",
        to_stage: "Ganho",
        confirmed_value: 80,
        occurred_at: "2026-10-08T04:00:00Z",
      },
    ];
    expect(
      latestWonEvents(
        events,
        new Map([
          ["a", "Ganho"],
          ["b", "Perdido"],
        ]),
        "2026-10-07T03:00:00Z",
        "2026-10-14T03:00:00Z",
      ),
    ).toEqual([events[2]]);
  });
});
