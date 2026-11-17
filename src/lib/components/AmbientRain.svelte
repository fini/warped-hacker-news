<script lang="ts">
	import { onMount } from 'svelte';
	let { enabled = true }: { enabled?: boolean } = $props();
	let canvas: HTMLCanvasElement;
	let animating = $state(false);
	onMount(() => {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		const columns: { x: number; y: number; speed: number; seed: number }[] = [];
		const glyphs =
			'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
		let context: CanvasRenderingContext2D | null = null;
		let width = 0,
			height = 0,
			size = 16,
			color = '',
			font = '';
		let frame = 0,
			timer = 0,
			last = 0;
		const stop = () => {
			cancelAnimationFrame(frame);
			clearTimeout(timer);
			frame = 0;
			timer = 0;
			last = 0;
			animating = false;
			context?.clearRect(0, 0, width, height);
		};
		const resize = () => {
			width = innerWidth;
			height = innerHeight;
			const scale = Math.min(1, 1920 / width, 1080 / height);
			canvas.width = Math.ceil(width * scale);
			canvas.height = Math.ceil(height * scale);
			context = canvas.getContext('2d');
			if (!context) return;
			context.setTransform(scale, 0, 0, scale, 0, 0);
			const style = getComputedStyle(canvas);
			const root = getComputedStyle(document.documentElement);
			size = parseFloat(root.fontSize);
			color = style.color;
			font = style.fontFamily;
			columns.length = 0;
			const count = Math.min(42, Math.ceil(width / (size * 2.75)));
			for (let i = 0; i < count; i++)
				columns.push({
					x: ((i + 0.3) * width) / count,
					y: Math.random() * (height + size * 12),
					speed: size * (0.8 + Math.random() * 0.6),
					seed: i * 137
				});
		};
		const draw = (time: number) => {
			if (!animating || !context) return;
			const elapsed = last ? Math.min((time - last) / 1000, 0.2) : 0;
			last = time;
			context.clearRect(0, 0, width, height);
			context.font = `${size}px ${font}`;
			context.fillStyle = color;
			for (const column of columns) {
				column.y += column.speed * elapsed;
				if (column.y - size * 9 > height) column.y = -size;
				for (let tail = 0; tail < 9; tail++) {
					const y = column.y - tail * size;
					if (y < 0 || y > height + size) continue;
					const index = (column.seed + tail * 19 + Math.floor(time / 2000)) % glyphs.length;
					context.globalAlpha = (1 - tail / 9) * 0.8;
					context.fillText(glyphs[index], column.x, y);
				}
			}
			context.globalAlpha = 1;
			timer = window.setTimeout(() => {
				frame = requestAnimationFrame(draw);
			}, 1000 / 12);
		};
		const sync = () => {
			stop();
			if (
				!enabled ||
				reduced.matches ||
				document.hidden ||
				getComputedStyle(canvas).display === 'none'
			)
				return;
			resize();
			if (!context) return;
			animating = true;
			frame = requestAnimationFrame(draw);
		};
		const observer = new MutationObserver(sync);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
		reduced.addEventListener('change', sync);
		document.addEventListener('visibilitychange', sync);
		window.addEventListener('resize', sync, { passive: true });
		sync();
		return () => {
			stop();
			observer.disconnect();
			reduced.removeEventListener('change', sync);
			document.removeEventListener('visibilitychange', sync);
			window.removeEventListener('resize', sync);
		};
	});
</script>

<canvas bind:this={canvas} class="ambient-background" aria-hidden="true" data-animating={animating}
></canvas>
