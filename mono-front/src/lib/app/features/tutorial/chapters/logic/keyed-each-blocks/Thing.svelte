<script lang="ts">
	const emojis = {
		apple: '🍎',
		banana: '🍌',
		carrot: '🥕',
		doughnut: '🍩',
		egg: '🥚'
	};

	interface Props {
		name: string;
	}

	// `name` is updated whenever the prop value changes...
	let { name }: Props = $props();

	// ...but `emoji` is fixed upon initialisation.
	// The caller uses a keyed {#each} block, so components are destroyed and recreated — not reused — when items change.
	// svelte-ignore state_referenced_locally
	// @ts-expect-error indexing emojis with arbitrary string
	const emoji = emojis[name];
</script>

<p>{emoji} = {name}</p>
