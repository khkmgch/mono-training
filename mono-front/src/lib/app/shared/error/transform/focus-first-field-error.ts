import { browser } from '$app/environment';

/**
 * Focus the first form control whose name matches the leading
 * {@link App.Error.fields} entry. No-op on SSR, when there are no fields,
 * or when the control cannot be found.
 *
 * Uses CSS attribute-selector escaping so names containing special characters
 * (brackets, dots, etc.) resolve correctly.
 */
export function focusFirstFieldError(
	formElement: HTMLFormElement,
	error: App.Error | undefined
): void {
	if (!browser) return;
	if (error?.fields === undefined || error.fields.length === 0) return;
	const first = error.fields[0];
	const selector = `[name="${escapeAttribute(first.name)}"]`;
	const target = formElement.querySelector<HTMLElement>(selector);
	if (target === null) return;
	target.focus();
}

function escapeAttribute(value: string): string {
	if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
		return CSS.escape(value);
	}
	return value.replaceAll(/(["\\])/g, String.raw`\$1`);
}
