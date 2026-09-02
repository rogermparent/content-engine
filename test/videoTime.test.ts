import { describe, expect, it } from "vitest";

import {
  parseTimeLabel,
  formatSeconds,
} from "@discontent/component-library/lib/videoTime";

/*
 * The label is the single source of truth for `<VideoTime>`: what readers see
 * is what the player seeks to. parseTimeLabel is the one place that decides
 * whether a label carries a time, so both the server render and the editor
 * derive identical seconds from identical labels.
 */
describe("parseTimeLabel", () => {
  it("parses M:SS clock labels", () => {
    expect(parseTimeLabel("3:37")).toBe(217);
    expect(parseTimeLabel("0:05")).toBe(5);
    expect(parseTimeLabel("12:00")).toBe(720);
  });

  it("parses H:MM:SS clock labels", () => {
    expect(parseTimeLabel("1:01:12")).toBe(3672);
  });

  it("parses bare seconds, with optional s suffix and fraction", () => {
    // "10s" appears in production content; 29.5 exists as a fractional
    // time={29.5} attribute in the kefir recipe.
    expect(parseTimeLabel("10s")).toBe(10);
    expect(parseTimeLabel("29.5")).toBe(29.5);
    // Bare numbers read as seconds by design ("350" → 350s). If this ever
    // misfires on real content, restrict to the s-suffixed form here.
    expect(parseTimeLabel("350")).toBe(350);
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseTimeLabel(" 3:37 ")).toBe(217);
  });

  it("rejects out-of-range clock components", () => {
    expect(parseTimeLabel("63:99")).toBeNull();
    expect(parseTimeLabel("1:2")).toBeNull(); // seconds must be two digits
  });

  it("rejects prose", () => {
    expect(parseTimeLabel("jars in the video")).toBeNull();
    expect(parseTimeLabel("")).toBeNull();
    expect(parseTimeLabel("3:37 in the video")).toBeNull();
  });
});

describe("formatSeconds", () => {
  it("formats sub-hour times as M:SS", () => {
    expect(formatSeconds(217)).toBe("3:37");
    expect(formatSeconds(5)).toBe("0:05");
  });

  it("formats hour-scale times as H:MM:SS", () => {
    expect(formatSeconds(3672)).toBe("1:01:12");
  });

  it("round-trips through parseTimeLabel", () => {
    for (const seconds of [5, 61, 217, 3599, 3672]) {
      expect(parseTimeLabel(formatSeconds(seconds))).toBe(seconds);
    }
  });

  it("truncates fractional seconds for display", () => {
    expect(formatSeconds(29.5)).toBe("0:29");
  });
});
