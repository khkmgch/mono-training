/**
 * Read a `FormData` entry as a string, returning `fallback` when the entry is
 * missing or a `File` (multipart upload).
 *
 * @remarks `FormData.get(name)` returns `string | File | null`. The naive
 *   `String(formData.get(key) ?? '')` produces `'[object File]'` for File
 *   values — flagged by typescript-eslint's `no-base-to-string` rule. This
 *   helper guards the File case explicitly.
 */
export function getString(fd: FormData, key: string, fallback = ''): string {
	const v = fd.get(key);
	return typeof v === 'string' ? v : fallback;
}

/**
 * Read a `FormData` entry as a finite number, returning `fallback` when the
 * entry is missing, a `File`, or not a finite number (e.g. `NaN`, `Infinity`).
 * Numeric parallel of {@link getString}.
 */
export function getNumber(fd: FormData, key: string, fallback = 0): number {
	const v = fd.get(key);
	if (typeof v !== 'string') return fallback;
	const n = Number(v);
	return Number.isFinite(n) ? n : fallback;
}
