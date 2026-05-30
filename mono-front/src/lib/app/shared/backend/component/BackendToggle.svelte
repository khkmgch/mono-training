<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';
	import { getToastContext } from '$lib/app/shared/toast';
	import { BACKEND_COOKIE } from '../store';
	import type { BackendTarget } from '../types';

	type Props = {
		/** Currently active backend (typically `data.backend` from the root layout). */
		current: BackendTarget;
	};

	let { current }: Props = $props();

	const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;
	const TOAST_DEDUP_KEY = 'backend-switch';
	const TOAST_AUTO_CLOSE_MS = 3000;

	const toasts = getToastContext();

	function targetLabel(target: BackendTarget): string {
		return target === 'quarkus'
			? m.shared_backend_target_quarkus()
			: m.shared_backend_target_json_server();
	}

	async function handleChange(event: Event & { currentTarget: HTMLSelectElement }): Promise<void> {
		const next = event.currentTarget.value as BackendTarget;
		document.cookie = `${BACKEND_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
		await invalidateAll();
		toasts.push({
			type: 'info',
			key: TOAST_DEDUP_KEY,
			message: m.shared_backend_switched({ target: targetLabel(next) }),
			autoCloseMs: TOAST_AUTO_CLOSE_MS
		});
	}
</script>

<!-- A11y: outer <label> provides the accessible name via implicit
	association — adding aria-label to <select> would double-read.
	Label is sr-only (dropdown options self-explain); dot is aria-hidden. -->
<label class="backend-toggle">
	<span class="sr-only">{m.shared_backend_toggle_label()}</span>
	<span class="backend-toggle-control">
		<span class="backend-toggle-dot" data-target={current} aria-hidden="true"></span>
		<select value={current} onchange={handleChange}>
			<option value="json-server">{m.shared_backend_target_json_server()}</option>
			<option value="quarkus">{m.shared_backend_target_quarkus()}</option>
		</select>
	</span>
</label>

<style>
	.backend-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--ds-space-2);
		margin: 0;
	}

	.backend-toggle-control {
		display: inline-flex;
		align-items: center;
		gap: var(--ds-space-2);
	}

	.backend-toggle-dot {
		flex: 0 0 auto;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
	}

	/* Dev-mode environment indicator. These colors are component-private
	 * (single consumer), so they live here rather than in the global token
	 * layer. pico v2 ships no named palette vars — literal fallbacks apply. */
	.backend-toggle-dot[data-target='quarkus'] {
		background-color: var(--pico-color-jade-500, #10b981);
	}

	.backend-toggle-dot[data-target='json-server'] {
		background-color: var(--pico-color-amber-400, #fbbf24);
	}

	/* Compact header-fit (~36 px vs pico's ~50 px). Scope-overriding pico's
	 * spacing vars makes its own `padding-right: calc(... + 1.5rem)` rule
	 * re-compute the chevron inset automatically — no magic padding needed. */
	.backend-toggle select {
		--pico-form-element-spacing-vertical: var(--ds-space-1);
		--pico-form-element-spacing-horizontal: var(--ds-space-3);
		margin: 0;
		font-size: var(--ds-fs-small);
		line-height: 1.4;
	}
</style>
