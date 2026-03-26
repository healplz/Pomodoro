import { renderHook, act } from "@testing-library/react";
import { useTimerCountdown } from "../useTimerCountdown";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useTimerCountdown", () => {
  it("does not call onTick or onComplete when totalSeconds is null", () => {
    const onTick = jest.fn();
    const onComplete = jest.fn();

    renderHook(() => useTimerCountdown(null, onTick, onComplete));

    act(() => { jest.advanceTimersByTime(5000); });

    expect(onTick).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("calls onTick immediately on mount with the full remaining time", () => {
    const onTick = jest.fn();
    renderHook(() => useTimerCountdown(5, onTick, jest.fn()));
    expect(onTick).toHaveBeenCalledWith(5);
  });

  it("calls onTick with decreasing remaining seconds each second", () => {
    const onTick = jest.fn();
    const onComplete = jest.fn();

    renderHook(() => useTimerCountdown(3, onTick, onComplete));

    act(() => { jest.advanceTimersByTime(1000); });
    expect(onTick).toHaveBeenLastCalledWith(2);

    act(() => { jest.advanceTimersByTime(1000); });
    expect(onTick).toHaveBeenLastCalledWith(1);
  });

  it("calls onComplete when the countdown reaches 0", () => {
    const onTick = jest.fn();
    const onComplete = jest.fn();

    renderHook(() => useTimerCountdown(2, onTick, onComplete));

    act(() => { jest.advanceTimersByTime(2000); });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls onTick with 0 before calling onComplete", () => {
    const calls: number[] = [];
    const onTick = jest.fn((r: number) => calls.push(r));
    const onComplete = jest.fn(() => calls.push(-1));

    renderHook(() => useTimerCountdown(2, onTick, onComplete));
    // immediate tick fires with 2 on mount
    act(() => { jest.advanceTimersByTime(2000); });

    expect(calls).toEqual([2, 1, 0, -1]);
  });

  it("does not call onComplete multiple times", () => {
    const onComplete = jest.fn();

    renderHook(() => useTimerCountdown(1, jest.fn(), onComplete));

    act(() => { jest.advanceTimersByTime(5000); }); // well past the end

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("clears the interval on unmount", () => {
    const onTick = jest.fn();
    const { unmount } = renderHook(() =>
      useTimerCountdown(10, onTick, jest.fn())
    );

    act(() => { jest.advanceTimersByTime(2000); });
    const callsAtUnmount = onTick.mock.calls.length;

    unmount();

    act(() => { jest.advanceTimersByTime(3000); });

    expect(onTick.mock.calls.length).toBe(callsAtUnmount);
  });

  it("restarts the countdown when totalSeconds changes", () => {
    const onTick = jest.fn();
    const onComplete = jest.fn();
    let seconds = 3;

    const { rerender } = renderHook(() =>
      useTimerCountdown(seconds, onTick, onComplete)
    );

    act(() => { jest.advanceTimersByTime(2000); });
    expect(onTick).toHaveBeenCalledWith(1);

    // Change totalSeconds — should restart
    seconds = 5;
    rerender();

    onTick.mockClear();
    act(() => { jest.advanceTimersByTime(1000); });
    expect(onTick).toHaveBeenLastCalledWith(4);
  });

  it("accepts updated onTick callback without restarting the timer", () => {
    const onTick1 = jest.fn();
    const onTick2 = jest.fn();
    let currentTick = onTick1;

    const { rerender } = renderHook(() =>
      useTimerCountdown(5, currentTick, jest.fn())
    );

    // immediate tick on mount + one interval tick
    act(() => { jest.advanceTimersByTime(1000); });
    expect(onTick1).toHaveBeenCalledTimes(2); // mount tick + 1s tick

    currentTick = onTick2;
    rerender();

    act(() => { jest.advanceTimersByTime(1000); });
    // The new callback should be used without restarting
    expect(onTick2).toHaveBeenCalledTimes(1);
    expect(onTick1).toHaveBeenCalledTimes(2); // not called again
  });
});
