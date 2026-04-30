/**
 * Combine an optional external `AbortSignal` with an optional timeout into a single
 * signal suitable for `fetch`.
 *
 * @returns
 * - `undefined` when neither input is provided (so `fetch` does not see a signal at all).
 * - The external signal as-is when no timeout is requested.
 * - A fresh timeout signal when no external signal is given.
 * - A composite via `AbortSignal.any` when both are present.
 *
 * @remarks `timeoutMs <= 0` (and `undefined`) disables the timeout — matching the convention
 *   used by `axios` and `ky` so the option can be set to `0` to override a non-zero default.
 *   When the timeout fires, the resulting signal's `reason` is a `DOMException` with
 *   `name === 'TimeoutError'`. Use {@link isTimeoutAbort} to distinguish that from an
 *   external abort.
 */
export function combineSignals(
	external?: AbortSignal,
	timeoutMs?: number
): AbortSignal | undefined {
	const timeoutSignal =
		timeoutMs !== undefined && timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined;

	if (external && timeoutSignal) {
		return AbortSignal.any([external, timeoutSignal]);
	}
	return external ?? timeoutSignal;
}

/**
 * Detect whether a signal was aborted by `AbortSignal.timeout` rather than by the caller's
 * own `AbortController.abort`. Used by the HTTP client to map the abort to `kind: 'timeout'`
 * vs. surfacing the caller's reason unchanged.
 *
 * @remarks Identification is by `reason.name === 'TimeoutError'` rather than
 *   `instanceof DOMException`. The latter is unreliable across realms (e.g. Node's
 *   `AbortSignal.timeout` builds a DOMException from Node's class, while jsdom installs
 *   its own DOMException global) — name-based checking matches the WHATWG spec which
 *   defines TimeoutError by name, not by class identity.
 */
export function isTimeoutAbort(signal: AbortSignal): boolean {
	const reason = signal.reason as { name?: unknown } | null | undefined;
	return reason != null && typeof reason === 'object' && reason.name === 'TimeoutError';
}
