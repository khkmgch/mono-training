// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { AppErrorAction, AppErrorCode, FieldError } from '$lib/app/shared/error';
import type { BackendTarget } from '$lib/app/shared/backend';

declare global {
	namespace App {
		interface Error {
			/** Short user-facing message. Always present. */
			message: string;
			/** Strict-union discriminator used for branching. */
			code?: AppErrorCode;
			/** HTTP status. */
			status?: number;
			/** Trace identifier (`X-Request-Id` from BE, otherwise FE-generated). */
			requestId?: string;
			/** Per-field detail for validation / unique-constraint failures. */
			fields?: ReadonlyArray<FieldError>;
			/** Hint that the failure is retryable (`NETWORK` / `TIMEOUT` / `RATE_LIMIT`). */
			retryable?: boolean;
			/** Seconds to wait before retrying (HTTP 429 / 503 `Retry-After`). */
			retryAfterSec?: number;
			/** UI surface hint used by `dispatchActionError`. */
			action?: AppErrorAction;
		}

		interface Locals {
			backend: BackendTarget;
			apiBaseURL: string;
		}

		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
