import { afterEach, expect, it, vi } from "vitest";
import { createFakeCallRingtone } from "../fakeCallAudio";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it("starts local ringing and releases audio resources when stopped", async () => {
  vi.useFakeTimers();
  const stop = vi.fn(), disconnect = vi.fn(), close = vi.fn().mockResolvedValue(undefined);
  const start = vi.fn();
  const createOscillator = vi.fn(() => ({ type: "", frequency: { value: 0 }, connect: vi.fn(), disconnect, start, stop, onended: null }));
  vi.stubGlobal("window", { setInterval, clearInterval });
  vi.stubGlobal("AudioContext", class {
    currentTime = 0;
    destination = {};
    createOscillator = createOscillator;
    createGain = () => ({ gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect });
    resume = vi.fn().mockResolvedValue(undefined);
    close = close;
  });
  const ringtone = createFakeCallRingtone();
  await ringtone.ready;
  expect(start).toHaveBeenCalled();
  vi.advanceTimersByTime(3000);
  const playingCount = start.mock.calls.length;
  expect(playingCount).toBeGreaterThan(4);
  ringtone.stop();
  expect(stop).toHaveBeenCalled();
  expect(disconnect).toHaveBeenCalled();
  expect(close).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(10000);
  expect(start).toHaveBeenCalledTimes(playingCount);
  ringtone.stop();
  expect(close).toHaveBeenCalledTimes(1);
});