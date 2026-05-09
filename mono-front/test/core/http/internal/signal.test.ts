import { describe, expect, it } from 'vitest';
import { combineSignals, isTimeoutAbort } from '$lib/core/http/internal/signal';

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe('combineSignals', () => {
	it('returns undefined when no external signal and no timeout', () => {
		expect(combineSignals()).toBeUndefined();
		expect(combineSignals(undefined, 0)).toBeUndefined();
	});

	it('returns the external signal as-is when no timeout is given', () => {
		const controller = new AbortController();
		expect(combineSignals(controller.signal, undefined)).toBe(controller.signal);
		expect(combineSignals(controller.signal, 0)).toBe(controller.signal);
	});

	it('returns a fresh timeout signal when only timeoutMs is given', () => {
		const signal = combineSignals(undefined, 100);
		expect(signal).toBeInstanceOf(AbortSignal);
		expect(signal?.aborted).toBe(false);
	});

	it('returns a composite signal when both an external signal and a timeout are given', () => {
		const controller = new AbortController();
		const signal = combineSignals(controller.signal, 100);
		expect(signal).toBeInstanceOf(AbortSignal);
		expect(signal).not.toBe(controller.signal);
	});

	it('aborts the composite signal when the external signal aborts', () => {
		const controller = new AbortController();
		const signal = combineSignals(controller.signal, 1000);
		expect(signal?.aborted).toBe(false);
		controller.abort('user-cancel');
		expect(signal?.aborted).toBe(true);
		expect(signal?.reason).toBe('user-cancel');
	});

	describe('timeout firing (real timers)', () => {
		it('aborts the timeout-only signal after timeoutMs elapses with a TimeoutError reason', async () => {
			const signal = combineSignals(undefined, 20);
			await wait(40);
			expect(signal?.aborted).toBe(true);
			expect((signal?.reason as { name?: string } | null)?.name).toBe('TimeoutError');
		});

		it('aborts the composite signal when the timeout fires before the external signal', async () => {
			const controller = new AbortController();
			const signal = combineSignals(controller.signal, 20);
			await wait(40);
			expect(signal?.aborted).toBe(true);
			expect((signal?.reason as { name?: string } | null)?.name).toBe('TimeoutError');
		});
	});
});

describe('isTimeoutAbort', () => {
	it('returns true when the signal was aborted by AbortSignal.timeout', async () => {
		const signal = AbortSignal.timeout(20);
		await wait(40);
		expect(signal.aborted).toBe(true);
		expect(isTimeoutAbort(signal)).toBe(true);
	});

	it('returns false when an external controller aborted the signal with a string reason', () => {
		const controller = new AbortController();
		controller.abort('user-cancel');
		expect(isTimeoutAbort(controller.signal)).toBe(false);
	});

	it('returns false when an external controller aborted with a non-TimeoutError DOMException', () => {
		const controller = new AbortController();
		controller.abort(new DOMException('aborted', 'AbortError'));
		expect(isTimeoutAbort(controller.signal)).toBe(false);
	});

	it('returns false for a non-aborted signal', () => {
		expect(isTimeoutAbort(new AbortController().signal)).toBe(false);
	});
});
