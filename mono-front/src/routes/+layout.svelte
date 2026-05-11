<script lang="ts">
	import '@picocss/pico/css/pico.min.css';
	import '../app.css';
	import favicon from '$lib/core/assets/favicon.svg';

	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	import { setPendingContext, PendingIndicator } from '$lib/app/shared/pending';
	import { setToastContext, Toaster } from '$lib/app/shared/toast';
	import { setConfirmContext, ConfirmDialog } from '$lib/app/shared/confirmation';
	import { BackendToggle } from '$lib/app/shared/backend';

	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	setPendingContext();
	setToastContext();
	setConfirmContext();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<PendingIndicator />
<Toaster />
<ConfirmDialog />

<div class="app-layout">
	<header class="global-header">
		<nav>
			<ul>
				<li><strong>Mono Training</strong></li>
			</ul>
			<ul>
				<li>
					<a href={resolve('/')} aria-current={page.url.pathname === '/' ? 'page' : undefined}>
						Tutorial
					</a>
				</li>
				<!-- TODO: Add more links as needed
				<li>
					<a
						href={resolve('/users')}
						aria-current={page.url.pathname.startsWith('/users') ? 'page' : undefined}
					>
						User Management
					</a>
				</li> -->
				<li>
					<BackendToggle current={data.backend} />
				</li>
			</ul>
		</nav>
	</header>

	{@render children()}
</div>

<style>
	:root {
		--z-pending-indicator: 100;
		--z-toaster: 200;
		--z-confirm-dialog: 300;
	}

	.app-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.global-header {
		padding: 0 1rem;
		border-bottom: 1px solid var(--pico-muted-border-color);
	}

	.global-header nav a {
		color: inherit;
	}

	.global-header nav a[aria-current='page'] {
		font-weight: bold;
	}

	.global-header nav a:is(:hover, :focus-visible) {
		background-color: var(--pico-card-sectioning-background-color);
	}
</style>
