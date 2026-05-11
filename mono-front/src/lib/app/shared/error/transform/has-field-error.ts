/**
 * Returns whether the given form-level error contains a per-field entry for
 * the named input. Used to drive `aria-invalid` and `FormFieldError` visibility.
 */
export function hasFieldError(error: App.Error | undefined, name: string): boolean {
	if (error?.fields === undefined) return false;
	return error.fields.some((field) => field.name === name);
}
