/**
 * Keeps a WebGL scene smooth: watches real frame times against the display's own refresh
 * rate (60, 120, 165 Hz...) and lowers the render resolution a small step when frames start
 * missing it, then raises it again once there is headroom. When everything keeps up, nothing
 * changes.
 */
export function createFrameGovernor({ min, max }: { min: number; max: number }) {
  let scale = max;
  let vsync = 1 / 60; // the display's frame interval, learned from the fastest frames
  let window: number[] = [];
  let calm = 0;
  return {
    get scale() {
      return scale;
    },
    /** Feed the real time since the last frame, in seconds. Returns true when the scale changed. */
    sample(dt: number) {
      if (dt <= 0 || dt > 0.25) return false; // tab switches and one-off stalls don't count
      window.push(dt);
      if (window.length < 45) return false;
      const sorted = window.slice().sort((a, b) => a - b);
      window = [];
      // on-time frames come in at the refresh interval; the fastest of them reveal it
      vsync = Math.max(1 / 250, Math.min(vsync, sorted[Math.floor(sorted.length * 0.1)] * 1.02));
      const late = sorted.filter((d) => d > vsync * 1.6).length / sorted.length;
      if (late > 0.12 && scale > min) {
        scale = Math.max(min, +(scale - 0.15).toFixed(2));
        calm = 0;
        return true;
      }
      if (late < 0.02) {
        if (++calm >= 8 && scale < max) {
          scale = Math.min(max, +(scale + 0.1).toFixed(2));
          calm = 0;
          return true;
        }
      } else {
        calm = 0;
      }
      return false;
    },
  };
}
