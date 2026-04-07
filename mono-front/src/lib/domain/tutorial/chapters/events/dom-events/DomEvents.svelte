<script lang="ts">
	let m = $state({ x: 0, y: 0 });

	function onpointermove(event: PointerEvent) {
		m.x = event.clientX;
		m.y = event.clientY;
	}
</script>

<div {onpointermove} role="presentation">
	The pointer is at {Math.round(m.x)} x {Math.round(m.y)}
</div>

<style>
	div {
		height: 200px;
		padding: 1rem;
		background-color: #f8fafc;
		border-radius: 0.25rem;
		touch-action: none;
	}
</style>
