<script lang="ts">
	import { onMount } from 'svelte';
	let { enabled = true }: { enabled?: boolean } = $props();
	let canvas: HTMLCanvasElement;
	let animating = $state(false);
	let phase = $state<'off' | 'burst' | 'idle'>('off');
	onMount(() => {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		const glyphs =
			'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
		const streams: {
			x: number;
			y: number;
			speed: number;
			seed: number;
			length: number;
			delay: number;
		}[] = [];
		let context: CanvasRenderingContext2D | null = null;
		let width = 0,
			height = 0,
			size = 16,
			color = '',
			highlight = '',
			font = '';
		let frame = 0,
			timer = 0,
			last = 0,
			started = 0;
		const clear = () => context?.clearRect(0, 0, width, height);
		const stop = () => {
			cancelAnimationFrame(frame);
			clearTimeout(timer);
			frame = 0;
			timer = 0;
			last = 0;
			animating = false;
			phase = 'off';
			clear();
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
			size = parseFloat(getComputedStyle(document.documentElement).fontSize);
			color = style.color;
			highlight = style.getPropertyValue('--ambient-highlight').trim();
			font = style.fontFamily;
		};
		const burst = () => {
			if (!animating) return;
			streams.length = 0;
			const count = width < 600 ? 2 : 3;
			for (let i = 0; i < count; i++) {
				const inset = size * 0.15 + Math.random() * Math.min(size * 2, width * 0.015);
				streams.push({
					x:
						i === 0 ? inset : i === 1 ? width - size - inset : width * (0.15 + Math.random() * 0.7),
					y: -size,
					speed: Math.max(height * 0.9, size * 35) * (1 + Math.random() * 0.5),
					seed: Math.floor(Math.random() * 10000),
					length: 8 + Math.floor(Math.random() * 8),
					delay: i * 0.1 + Math.random() * 0.08
				});
			}
			phase = 'burst';
			last = 0;
			started = performance.now();
			frame = requestAnimationFrame(draw);
		};
		const draw = (time: number) => {
			if (!animating || !context) return;
			const elapsed = last ? Math.min((time - last) / 1000, 0.1) : 0;
			last = time;
			clear();
			context.font = `${size}px ${font}`;
			let alive = false;
			for (const stream of streams) {
				if ((time - started) / 1000 < stream.delay) {
					alive = true;
					continue;
				}
				stream.y += stream.speed * elapsed;
				if (stream.y - stream.length * size > height) continue;
				alive = true;
				for (let tail = stream.length - 1; tail >= 0; tail--) {
					const y = stream.y - tail * size;
					if (y < 0 || y > height + size) continue;
					const bright = tail === 0 || (stream.seed + tail * 13) % 17 === 0;
					context.fillStyle = bright ? highlight : color;
					context.globalAlpha = bright ? 0.95 : Math.pow(1 - tail / stream.length, 1.5) * 0.55;
					context.shadowColor = highlight;
					context.shadowBlur = bright ? size * 0.3 : 0;
					const index = (stream.seed + tail * 19 + Math.floor(time / 160)) % glyphs.length;
					context.fillText(glyphs[index], stream.x, y);
				}
			}
			context.globalAlpha = 1;
			context.shadowBlur = 0;
			if (!alive) {
				clear();
				phase = 'idle';
				timer = window.setTimeout(burst, 5000 + Math.random() * 6000);
				return;
			}
			frame = requestAnimationFrame(draw);
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
			burst();
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

<canvas
	bind:this={canvas}
	class="ambient-background"
	aria-hidden="true"
	data-animating={animating}
	data-phase={phase}
></canvas>
