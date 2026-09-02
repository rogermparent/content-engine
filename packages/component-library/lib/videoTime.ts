/**
 * Parse a human-readable video-time label into seconds, or null when the label
 * isn't a time. This is what lets `<VideoTime>5:07</VideoTime>` carry a single
 * source of truth: the label is shown to readers *and* parsed for seeking, on
 * both the server render and in the editor. An explicit `time={N}` attribute
 * only exists for labels this function can't parse ("jars in the video") or
 * deliberate overrides.
 *
 * Accepted (after trimming): `M:SS`/`MM:SS`, `H:MM:SS`, and bare seconds with
 * an optional `s` suffix and optional fraction (`10s`, `29.5`, `350`).
 */
export function parseTimeLabel(label: string): number | null {
  const trimmed = label.trim();

  const clock = /^(\d{1,3}):([0-5]\d)$/.exec(trimmed);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

  const clockHours = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(trimmed);
  if (clockHours) {
    return (
      Number(clockHours[1]) * 3600 +
      Number(clockHours[2]) * 60 +
      Number(clockHours[3])
    );
  }

  const seconds = /^(\d+(?:\.\d+)?)s?$/.exec(trimmed);
  if (seconds) return Number(seconds[1]);

  return null;
}

/** Format seconds as a clock label: 217 → "3:37", 3672 → "1:01:12". */
export function formatSeconds(seconds: number): string {
  const whole = Math.floor(seconds);
  const s = whole % 60;
  const m = Math.floor(whole / 60) % 60;
  const h = Math.floor(whole / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
