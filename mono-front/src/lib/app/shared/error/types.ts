/**
 * Public type definitions for the `app/shared/error` layer.
 *
 * This file is the single source of truth for {@link AppErrorCode},
 * {@link AppErrorAction}, {@link FieldError}, and {@link ProblemValidationError}.
 * The `app.d.ts` file imports these types and merges them into `App.Error`,
 * so the two never drift apart.
 */

/**
 * Discriminator used to branch UI behavior and toast wording.
 *
 * `inferCode` (in `transform/problem-mapping.ts`) decides which value applies
 * for a given {@link import('$lib/core/http').HttpError}.
 */
export type AppErrorCode =
	| 'VALIDATION'
	| 'CONFLICT_UNIQUE'
	| 'CONFLICT_VERSION'
	| 'NOT_FOUND'
	| 'RATE_LIMIT'
	| 'NETWORK'
	| 'TIMEOUT'
	| 'PARSE'
	| 'SYSTEM';

/**
 * Hint for which UI surface should display the error.
 *
 * - `'inline'`: per-field inline (`FormFieldError`) plus banner summary
 * - `'banner'`: full-form banner (`FormBanner` / `ConflictBanner`)
 * - `'page'`: full-page error (`+error.svelte` -> `ErrorPage`)
 *
 * `dispatchActionError` uses this to decide between `fail()` and `error()`.
 */
export type AppErrorAction = 'inline' | 'banner' | 'page';

/**
 * Per-field error rendered by `FormFieldError` and summarized by `FormBanner`.
 *
 * `name` MUST match the form `<input name="...">` so jump-to-field links and
 * `focusFirstFieldError` can resolve the element.
 */
export type FieldError = {
	name: string;
	message: string;
	/** Validation rule name from the backend (e.g. `'required'`, `'too_long'`). */
	code?: string;
};

/**
 * Shape the backend serializes into the top-level `errors` field of
 * a ProblemDetails response (RFC 9457 §3 extension members are placed
 * directly on the ProblemDetails object, not inside an `extensions` envelope).
 *
 * @remarks Used for `urn:problem:validation` (HTTP 422) and
 *   `urn:problem:conflict-unique` (HTTP 409). `to-app-error.ts` reads
 *   `err.problem?.errors` as `ProblemValidationError[]` and converts to
 *   {@link FieldError}[].
 */
export type ProblemValidationError = {
	name: string;
	message: string;
	code?: string;
};
