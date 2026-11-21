<script lang="ts">
	let {
		name,
		size = 18
	}: {
		name:
			| 'arrow'
			| 'external'
			| 'menu'
			| 'close'
			| 'chevron'
			| 'sun'
			| 'spark'
			| 'moon'
			| 'monitor'
			| 'layout'
			| 'panels'
			| 'terminal'
			| 'check'
			| 'city'
			| 'bookmark'
			| 'bookmark-filled'
			| 'refresh';
		size?: number;
	} = $props();
	const bookmark = 'M6 4h12v16l-6-4-6 4z';
	const paths = {
		bookmark,
		'bookmark-filled': bookmark,
		refresh: 'M20 7v5h-5M20 12a8 8 0 1 0-2 5.3',
		city: 'M3 21V9h5v12M8 21V3h8v18M16 21V12h5v9M11 7h2M11 11h2M11 15h2M2 21h20',
		check: 'm5 12 4 4L19 6',
		moon: 'M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z',
		monitor: 'M3 4h18v13H3zM8 21h8M12 17v4',
		layout: 'M4 4h16v16H4zM4 9h16M8 13h8M8 16h5',
		panels: 'M9 4H6a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h3M12 4h9M12 9h9M12 14h9M12 20h9',
		terminal: 'M3 4h18v16H3zM7 9l3 3-3 3M13 15h4',
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
	fill={name === 'bookmark-filled' ? 'currentColor' : 'none'}
	stroke="currentColor"
	stroke-width="1.6"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"><path d={paths[name]} /></svg
>
