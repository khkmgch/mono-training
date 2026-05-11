<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';
	import { BACKEND_COOKIE } from '../store';
	import type { BackendTarget } from '../types';

	type Props = {
		/** Currently active backend (typically `data.backend` from the root layout). */
		current: BackendTarget;
	};

	let { current }: Props = $props();

	const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

	async function handleChange(event: Event & { currentTarget: HTMLSelectElement }): Promise<void> {
		const next = event.currentTarget.value as BackendTarget;
		document.cookie = `${BACKEND_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
		await invalidateAll();
	}
</script>

<label class="backend-toggle">
	<span>{m.shared_backend_toggle_label()}</span>
	<select value={current} onchange={handleChange}>
		<option value="json-server">{m.shared_backend_target_json_server()}</option>
		<option value="quarkus">{m.shared_backend_target_quarkus()}</option>
	</select>
</label>

<style>
	.backend-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
	}

	.backend-toggle select {
		margin: 0;
	}
</style>
