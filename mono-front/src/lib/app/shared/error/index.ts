export type { AppErrorAction, AppErrorCode, FieldError, ProblemValidationError } from './types';

export { PROBLEM_TYPE_TO_CODE, inferAction, inferCode } from './transform/problem-mapping';
export { toAppError } from './transform/to-app-error';
export { toSvelteError } from './transform/to-svelte-error';
export { toFormFail } from './transform/to-form-fail';
export { toErrorToast } from './transform/to-toast';
export { handleUnexpected } from './transform/handle-unexpected';
export { dispatchActionError, dispatchLoadError } from './transform/dispatch';
export { hasFieldError } from './transform/has-field-error';
export { focusFirstFieldError } from './transform/focus-first-field-error';

export { default as ErrorPage } from './component/ErrorPage.svelte';
export { default as FormBanner } from './component/FormBanner.svelte';
export { default as FormFieldError } from './component/FormFieldError.svelte';
export { default as ConflictBanner } from './component/ConflictBanner.svelte';
export { default as FormErrors } from './component/FormErrors.svelte';
