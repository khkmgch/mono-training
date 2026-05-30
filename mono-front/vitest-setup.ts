import '@testing-library/jest-dom/vitest';

// jsdom doesn't provide `ResizeObserver`. `core/Table` uses it for
// overflow-tooltip reconciliation; the initial sync reconcile runs once on
// mount, so a no-op stub is enough for unit tests.
if (globalThis.ResizeObserver === undefined) {
	globalThis.ResizeObserver = class implements ResizeObserver {
		constructor(_callback: ResizeObserverCallback) {}
		observe(): void {}
		unobserve(): void {}
		disconnect(): void {}
	};
}
