export const counter = $state({
	count: 0
});

export function resetCounter() {
	counter.count = 0;
}
