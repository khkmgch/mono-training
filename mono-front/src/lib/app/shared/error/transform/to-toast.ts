import { isHttpError, type HttpError } from '$lib/core/http';
import type { ToastInput } from '../../toast';
import { toAppError } from './to-app-error';

/**
 * Build a {@link ToastInput} for an error. Suitable for non-form async failures
 * (downloads, exports, batch ops). Form-action errors must NOT use this — route
 * them through `dispatchActionError` instead.
 *
 * @remarks `key` is `requestId ?? code` so repeat firings collapse to one toast.
 *   `autoCloseMs` is `0` (manual dismiss only) per WCAG 2.2.3.
 */
export function toErrorToast(err: HttpError | App.Error): ToastInput {
	const appErr = isHttpError(err) ? toAppError(err) : err;
	const key = appErr.requestId ?? appErr.code;
	const toast: ToastInput = {
		type: 'error',
		message: appErr.message,
		autoCloseMs: 0
	};
	if (key !== undefined) toast.key = key;
	return toast;
}
