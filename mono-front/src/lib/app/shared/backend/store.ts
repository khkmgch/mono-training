import type { BackendTarget } from './types';

/** Cookie name that stores the user's selected {@link BackendTarget}. */
export const BACKEND_COOKIE = 'backend' as const;

/**
 * Base URL for each backend target. Centralized so the toggle and the HTTP
 * factory share a single source of truth.
 *
 * @remarks
 * - json-server runs locally on `:3000` (started via `pnpm mock`).
 * - Quarkus runs locally on `:8080`. When the project introduces a context path,
 *   update the value here only.
 */
export const BACKEND_BASE_URLS: Readonly<Record<BackendTarget, string>> = Object.freeze({
	'json-server': 'http://localhost:3000',
	quarkus: 'http://localhost:8080'
});

const KNOWN_TARGETS: ReadonlyArray<BackendTarget> = ['json-server', 'quarkus'];

const DEFAULT_TARGET: BackendTarget = 'json-server';

function isKnownTarget(value: string): value is BackendTarget {
	return (KNOWN_TARGETS as ReadonlyArray<string>).includes(value);
}

/**
 * Read the active {@link BackendTarget} from cookies.
 *
 * @remarks Unset / unknown values fall back to {@link DEFAULT_TARGET} so SSR is
 *   never broken by a malformed cookie.
 */
export function readBackend(cookies: { get(name: string): string | undefined }): BackendTarget {
	const raw = cookies.get(BACKEND_COOKIE);
	if (raw !== undefined && isKnownTarget(raw)) return raw;
	return DEFAULT_TARGET;
}

/** Resolve the base URL for a given target. */
export function resolveBaseURL(target: BackendTarget): string {
	return BACKEND_BASE_URLS[target];
}
