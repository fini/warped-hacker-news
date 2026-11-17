<script lang="ts">
	let {
		name,
		size = 18
	}: {
		name: 'arrow' | 'external' | 'menu' | 'close' | 'chevron' | 'sun' | 'spark';
		size?: number;
	} = $props();
	const paths = {
		arrow: 'M4 12h16m-6-6 6 6-6 6',
		external: 'M14 4h6v6M20 4 10 14M10 4H4v16h16v-6',
		menu: 'M4 6h16M4 12h16M4 18h16',
		close: 'm6 6 12 12M6 18 18 6',
		chevron: 'm8 5 7 7-7 7',
		sun: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
		spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z'
	};
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.6"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"><path d={paths[name]} /></svg
>
