export type { BackendTarget } from './types';
export { BACKEND_COOKIE, BACKEND_BASE_URLS, readBackend, resolveBaseURL } from './store';
export { default as BackendToggle } from './component/BackendToggle.svelte';

export type { JsonServerListResponse } from './adapter';
export { jsonServerList, remapBuiltinKeysForJsonServer } from './adapter';
