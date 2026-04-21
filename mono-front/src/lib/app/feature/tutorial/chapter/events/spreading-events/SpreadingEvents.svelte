<script lang="ts">
	import BigRedButton from './BigRedButton.svelte';
	import horn from '$lib/app/feature/tutorial/assets/horn.mp3';

	const audio = new Audio();
	audio.src = horn;

	function honk() {
		audio.load();
		audio.play();
	}
</script>

<BigRedButton onclick={honk} />
