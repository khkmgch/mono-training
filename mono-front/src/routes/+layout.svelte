<script lang="ts">
	import '@picocss/pico/css/pico.min.css';
	import '../app.css';
	import favicon from '$lib/core/assets/favicon.svg';

	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages';

	import { setPendingContext, PendingIndicator } from '$lib/app/shared/pending';
	import { setToastContext, Toaster } from '$lib/app/shared/toast';
	import { setConfirmContext, ConfirmDialog } from '$lib/app/shared/confirmation';
	import { BackendToggle } from '$lib/app/shared/backend';

	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	setPendingContext();
	setToastContext();
	setConfirmContext();

	const isTutorialActive = $derived(page.url.pathname === '/');
	const isUsersActive = $derived(page.url.pathname.startsWith('/users'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<PendingIndicator />
<Toaster />
<ConfirmDialog />

<a class="ds-skip-link" href="#main-content">{m.common_a11y_skip_to_main()}</a>

<div class="app-shell">
	<header class="global-header">
		<div class="header-inner">
			<a class="brand" href={resolve('/')} aria-label="Mono Training Home">
				<strong>Mono Training</strong>
			</a>

			<nav class="primary-nav" aria-label={m.app_nav_primary_label()}>
				<ul>
					<li>
						<a href={resolve('/')} aria-current={isTutorialActive ? 'page' : undefined}>
							{m.app_nav_tutorial()}
						</a>
					</li>
					<li>
						<a href={resolve('/users')} aria-current={isUsersActive ? 'page' : undefined}>
							{m.app_nav_users()}
						</a>
					</li>
				</ul>
			</nav>

			<div class="header-tools" role="group" aria-label={m.shared_backend_region_label()}>
				<BackendToggle current={data.backend} />
			</div>
		</div>
	</header>

	<main id="main-content" tabindex="-1" class="app-main">
		{@render children()}
	</main>
</div>

<style>
	.global-header {
		position: sticky;
		top: 0;
		z-index: var(--ds-z-header);
		background-color: var(--ds-surface-page);
		border-bottom: 1px solid var(--ds-border-subtle);
	}

	.header-inner {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: var(--ds-space-4);
		max-width: var(--ds-layout-max-w);
		height: var(--ds-header-h);
		margin: 0 auto;
		padding: 0 var(--ds-space-4);
	}

	.header-inner > * {
		min-width: 0;
	}

	.brand {
		color: inherit;
		text-decoration: none;
	}

	.primary-nav ul {
		display: flex;
		gap: var(--ds-space-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.primary-nav a {
		display: inline-flex;
		align-items: center;
		padding: var(--ds-space-2) var(--ds-space-3);
		color: var(--ds-text-primary);
		font-weight: 500;
		text-decoration: none;
		white-space: nowrap;
		border-radius: var(--pico-border-radius);
		transition: background-color var(--ds-duration-fast) var(--ds-ease);
	}

	.primary-nav a:hover {
		background-color: var(--ds-surface-hover);
	}

	.primary-nav a:focus-visible {
		outline: 2px solid var(--ds-color-accent-focus);
		outline-offset: 2px;
	}

	.primary-nav a[aria-current='page'] {
		background-color: var(--ds-surface-section);
		font-weight: 600;
		/* Color + underline for reduced-contrast/colorblind users. */
		box-shadow: inset 0 -2px 0 var(--ds-color-accent);
	}

	.header-tools {
		display: inline-flex;
		align-items: center;
		gap: var(--ds-space-2);
		margin-bottom: 0;
	}

	.ds-skip-link {
		position: absolute;
		top: -100px;
		left: var(--ds-space-2);
		z-index: 1000;
		padding: var(--ds-space-2) var(--ds-space-3);
		background: var(--ds-surface-card);
		border: 1px solid var(--ds-border-strong);
		border-radius: var(--pico-border-radius);
		text-decoration: none;
	}

	.ds-skip-link:focus-visible {
		top: var(--ds-space-2);
		outline: 2px solid var(--ds-color-accent-focus);
	}

	@media (max-width: 575px) {
		/* Explicit grid-areas required: auto-placement otherwise pushes tools to a third row. */
		.header-inner {
			grid-template-columns: 1fr auto;
			grid-template-areas: 'brand tools' 'nav nav';
			height: auto;
			row-gap: var(--ds-space-2);
		}

		.brand {
			grid-area: brand;
		}

		.header-tools {
			grid-area: tools;
			justify-self: end;
		}

		.primary-nav {
			grid-area: nav;
			padding-top: var(--ds-space-2);
			border-top: 1px solid var(--ds-border-subtle);
		}
	}
</style>
