/** Result of {@link serializeBody}: a fetch-ready body and an optional auto-applied Content-Type. */
export type SerializedBody = Readonly<{
	body: BodyInit | null;
	/** Set only when the body was JSON-serialized. The caller decides whether to apply it. */
	contentType?: string;
}>;

/**
 * Normalize a request body into a `BodyInit | null` that `fetch` accepts, and
 * indicate whether a default `Content-Type` should be applied.
 *
 * @remarks
 * - `null` / `undefined` → `body: null`, no Content-Type.
 * - `FormData` / `URLSearchParams` / `Blob` / `ArrayBuffer(View)` / `ReadableStream` / `string`
 *   → passed through unchanged. `fetch` auto-sets `Content-Type` for `FormData` / `URLSearchParams` /
 *   `Blob` (with its `type`); other types are left to the caller.
 * - Anything else (plain objects, arrays, numbers, booleans) → `JSON.stringify(body)` with
 *   `contentType: 'application/json'`. The orchestrator only applies this Content-Type when
 *   the merged headers do not already define one.
 */
export function serializeBody(body: unknown): SerializedBody {
	if (body === null || body === undefined) {
		return { body: null };
	}
	if (
		body instanceof FormData ||
		body instanceof URLSearchParams ||
		body instanceof Blob ||
		body instanceof ArrayBuffer ||
		ArrayBuffer.isView(body) ||
		body instanceof ReadableStream ||
		typeof body === 'string'
	) {
		return { body: body as BodyInit };
	}
	return {
		body: JSON.stringify(body),
		contentType: 'application/json'
	};
}
