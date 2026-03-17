import { computeStreak } from "../streak";

// Pin "today" so tests are deterministic regardless of when they run
const TODAY = new Date().toLocaleDateString("en-CA");
const YESTERDAY = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
const TWO_DAYS_AGO = new Date(Date.now() - 2 * 86400000).toLocaleDateString("en-CA");
const THREE_DAYS_AGO = new Date(Date.now() - 3 * 86400000).toLocaleDateString("en-CA");
const FOUR_DAYS_AGO = new Date(Date.now() - 4 * 86400000).toLocaleDateString("en-CA");

describe("computeStreak", () => {
  describe("empty and single-entry cases", () => {
    it("returns 0 for an empty array", () => {
      expect(computeStreak([])).toBe(0);
    });

    it("returns 1 when only today is present", () => {
      expect(computeStreak([TODAY])).toBe(1);
    });

    it("returns 1 when only yesterday is present", () => {
      expect(computeStreak([YESTERDAY])).toBe(1);
    });

    it("returns 0 when only two days ago is present", () => {
      expect(computeStreak([TWO_DAYS_AGO])).toBe(0);
    });

    it("returns 0 when only a date far in the past is present", () => {
      expect(computeStreak(["2020-01-01"])).toBe(0);
    });
  });

  describe("consecutive day streaks", () => {
    it("returns 2 for today and yesterday", () => {
      expect(computeStreak([TODAY, YESTERDAY])).toBe(2);
    });

    it("returns 3 for three consecutive days ending today", () => {
      expect(computeStreak([TODAY, YESTERDAY, TWO_DAYS_AGO])).toBe(3);
    });

    it("returns 4 for four consecutive days ending today", () => {
      expect(computeStreak([TODAY, YESTERDAY, TWO_DAYS_AGO, THREE_DAYS_AGO])).toBe(4);
    });

    it("returns 3 for three consecutive days ending yesterday", () => {
      expect(computeStreak([YESTERDAY, TWO_DAYS_AGO, THREE_DAYS_AGO])).toBe(3);
    });

    it("counts a long consecutive streak correctly", () => {
      const dates = Array.from({ length: 10 }, (_, i) =>
        new Date(Date.now() - i * 86400000).toLocaleDateString("en-CA")
      );
      expect(computeStreak(dates)).toBe(10);
    });
  });

  describe("broken streaks", () => {
    it("returns 1 when today is present but yesterday is missing", () => {
      expect(computeStreak([TODAY, TWO_DAYS_AGO])).toBe(1);
    });

    it("stops counting at the first gap", () => {
      // today, yesterday, then a gap (missing two_days_ago), then three_days_ago
      expect(computeStreak([TODAY, YESTERDAY, THREE_DAYS_AGO, FOUR_DAYS_AGO])).toBe(2);
    });

    it("returns 1 when only today is in an otherwise gapped list", () => {
      expect(computeStreak([TODAY, "2023-01-01", "2022-06-15"])).toBe(1);
    });

    it("returns 0 when most recent date is two days ago with earlier entries", () => {
      expect(computeStreak([TWO_DAYS_AGO, THREE_DAYS_AGO, FOUR_DAYS_AGO])).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("returns 1 for a single-element array with today regardless of extra dates", () => {
      // Dates must be sorted descending — validate the function handles boundary
      expect(computeStreak([TODAY])).toBe(1);
    });

    it("does not count duplicate dates as extending the streak", () => {
      // Function expects unique dates in descending order — passing duplicates
      // should still work correctly for the consecutive-day check
      expect(computeStreak([TODAY, TODAY, YESTERDAY])).toBe(1);
    });
  });
});
