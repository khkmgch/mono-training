<script lang="ts">
	import favicon from '$lib/core/assets/favicon.svg';

	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<title>Mono Training</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-layout">
	<header class="global-header">
		<nav>
			<a href={resolve('/')} aria-current={page.url.pathname === '/' ? 'page' : undefined}>
				Tutorial
			</a>
			// TODO: Add more links as needed
			<!-- <a
				href={resolve('/users')}
				aria-current={page.url.pathname.startsWith('/users') ? 'page' : undefined}
			>
				User Management
			</a> -->
		</nav>
	</header>

	{@render children()}
</div>

<style>
	:global(:root) {
		--color-border: #d1d5db;
		--color-surface-hover: #f3f4f6;
		--color-text-muted: #6b7280;
		--color-accent: #2563eb;
	}

	:global(body) {
		margin: 0;
	}

	.app-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.global-header {
		border-bottom: 1px solid var(--color-border);
	}

	nav {
		display: flex;
		gap: 1rem;
		padding: 0.75rem 1rem;
	}

	nav a {
		padding: 0.25rem 0.5rem;
		color: inherit;
		text-decoration: none;
	}

	nav a[aria-current='page'] {
		font-weight: bold;
	}

	nav a:hover,
	nav a:focus-visible {
		background-color: var(--color-surface-hover);
	}
</style>
