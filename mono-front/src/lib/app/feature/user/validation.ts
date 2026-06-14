import type { FieldError } from '$lib/app/shared/error';

// Keep in sync with the backend Bean Validation on CreateUserRequest / UpdateUserRequest.
export const LOGIN_ID_MIN = 3;
export const LOGIN_ID_MAX = 64;
export const FULL_NAME_MAX = 100;

/** HTML5 `pattern` attribute source (auto-anchored by the browser). */
export const LOGIN_ID_PATTERN_SOURCE = '[A-Za-z0-9._-]+';
const LOGIN_ID_PATTERN = new RegExp(`^${LOGIN_ID_PATTERN_SOURCE}$`);

/**
 * Validate a login id that has already been canonicalized (see `stripSpaces`).
 * `message` is a debug-only fallback; `FormFieldError` localizes by `code`.
 *
 * @returns a {@link FieldError} for `FormFieldError`, or `null` when valid.
 */
export function validateLoginId(value: string): FieldError | null {
	if (value === '') return { name: 'loginId', code: 'required', message: 'required' };
	if (value.length < LOGIN_ID_MIN) return { name: 'loginId', code: 'min', message: 'too short' };
	if (value.length > LOGIN_ID_MAX) return { name: 'loginId', code: 'size', message: 'too long' };
	if (!LOGIN_ID_PATTERN.test(value))
		return { name: 'loginId', code: 'pattern', message: 'invalid characters' };
	return null;
}

/** Validate a canonicalized full name (see `collapseSpaces`). */
export function validateFullName(value: string): FieldError | null {
	if (value === '') return { name: 'fullName', code: 'required', message: 'required' };
	if (value.length > FULL_NAME_MAX) return { name: 'fullName', code: 'size', message: 'too long' };
	return null;
}
