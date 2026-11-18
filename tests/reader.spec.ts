import { test, expect } from '@playwright/test';
test('appends stories and restores the list after reading discussions', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Stay curious.' })).toBeVisible();
	await expect(page.locator('.brand-sub')).toHaveText('engaged');
	await expect(page).toHaveTitle(/Warped Hacker News, engaged/);
	await expect(page.locator('.story-row').first()).toBeVisible();
	const firstId = await page.locator('.story-row').first().getAttribute('id');
	const initialCount = await page.locator('.story-row').count();
	const more = page.getByRole('button', { name: 'More stories', exact: true });
	await more.scrollIntoViewIfNeeded();
	const scroll = await page.evaluate(() => scrollY);
	await more.click();
	await expect.poll(() => page.locator('.story-row').count()).toBeGreaterThan(initialCount);
	const expandedCount = await page.locator('.story-row').count();
	expect(expandedCount).toBeLessThanOrEqual(initialCount + 30);
	await expect(page).toHaveURL(/\/$/);
	expect(await page.locator('.story-row').first().getAttribute('id')).toBe(firstId);
	expect(Math.abs((await page.evaluate(() => scrollY)) - scroll)).toBeLessThan(10);
	await page.locator('.comment-count').nth(initialCount).click();
	await expect(page.locator('.discussion-heading')).toBeVisible();
	await page.goBack();
	await expect(page.locator('.story-row')).toHaveCount(expandedCount);
	expect(await page.locator('.story-row').first().getAttribute('id')).toBe(firstId);
	await page.locator('.comment-count').nth(initialCount).click();
	await expect(page.locator('.discussion-heading')).toBeVisible();
	const author = page.locator('.reading-page > .story-meta a').first();
	if (await author.count()) {
		await author.click();
		await expect(page.locator('.profile-stats')).toBeVisible();
	}
});
test('themes persist and stay within mobile viewport', async ({ page }) => {
	await page.goto('/');
	for (const theme of ['lcars', 'matrix', 'noir', 'modern']) {
		await page.getByRole('button', { name: 'Appearance', exact: true }).click();
		await page
			.getByRole('radio', {
				name:
					theme === 'lcars'
						? 'LCARS'
						: theme === 'matrix'
							? 'Matrix'
							: theme === 'noir'
								? 'Neon Noir'
								: 'Modern',
				exact: true
			})
			.check();
		await page.getByRole('button', { name: 'Apply appearance' }).click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
		await page.reload();
		await page.screenshot({ path: `test-results/theme-${theme}-${test.info().project.name}.png` });
		await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
		await page.getByRole('button', { name: 'Appearance', exact: true }).click();
		await page.screenshot({
			path: `test-results/appearance-${theme}-${test.info().project.name}.png`
		});
		await page.keyboard.press('Escape');
		if (theme === 'noir') {
			const columns = await page
				.locator('.feed-section')
				.evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length);
			expect(columns).toBe(test.info().project.name === 'desktop' ? 2 : 1);
		}
		if (theme === 'lcars') {
			expect(
				await page.locator('.site-header').evaluate((e) => getComputedStyle(e).borderTopWidth)
			).toBe('0px');
			if (test.info().project.name === 'desktop')
				expect(
					parseFloat(
						await page
							.getByRole('navigation', { name: 'Feeds' })
							.getByRole('link', { name: 'Top', exact: true })
							.evaluate((e) => getComputedStyle(e).borderTopRightRadius)
					)
				).toBeGreaterThan(100);
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
	}
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.screenshot({
		path: `test-results/reader-${test.info().project.name}.png`,
		fullPage: true
	});
});
test('invalid stories and feeds return useful errors', async ({ page }) => {
	const response = await page.goto('/item/not-a-number');
	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'A detour in the signal.' })).toBeVisible();
	expect((await page.goto('/not-a-feed'))?.status()).toBe(404);
});

test('all feeds render and mobile navigation works', async ({ page, isMobile }) => {
	await page.goto('/');
	if (isMobile) {
		await page.getByRole('button', { name: 'Toggle navigation' }).click();
		await expect(page.getByRole('navigation', { name: 'Feeds' })).toBeVisible();
	}
	for (const feed of ['new', 'best', 'ask', 'show', 'jobs']) {
		await page.goto(`/${feed}`);
		await expect(page.locator('.story-row').first()).toBeVisible();
	}
});

test('reply loading reports errors, retries and collapses', async ({ page }) => {
	await page.goto('/');
	await page.locator('.comment-count').first().click();
	const button = page.getByRole('button', { name: /Load replies|Load more comments/ }).first();
	await expect(button).toBeVisible();
	let calls = 0;
	await page.route('**/api/comments/*', async (route) => {
		calls++;
		if (calls === 1) await route.fulfill({ status: 503, body: 'unavailable' });
		else
			await route.fulfill({
				json: {
					items: [
						{
							id: 987654321,
							by: 'test-reader',
							time: 1,
							text: '<p>A recovered reply.</p>',
							kids: []
						}
					],
					failed: 0,
					nextOffset: 15,
					hasMore: false
				}
			});
	});
	await button.click();
	await expect(page.getByText('Couldn’t load replies. Please try again.')).toBeVisible();
	await page.getByRole('button', { name: 'Retry replies' }).click();
	await expect(page.getByText('A recovered reply.')).toBeVisible();
	const comment = page.locator('#comment-987654321');
	await comment.getByRole('button', { name: 'Collapse comment by test-reader' }).click();
	await expect(page.getByText('A recovered reply.')).toBeHidden();
	await comment.getByRole('button', { name: 'Expand comment by test-reader' }).click();
	await expect(page.getByText('A recovered reply.')).toBeVisible();
});

test('appearance dialog supports keyboard, cancel and dark mode', async ({ page }) => {
	await page.goto('/');
	const trigger = page.getByRole('button', { name: 'Appearance', exact: true });
	await trigger.click();
	const dialog = page.getByRole('dialog', { name: 'Make it yours.' });
	await expect(dialog).toBeVisible();
	await page.getByRole('radio', { name: 'LCARS', exact: true }).check();
	await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'modern');
	await trigger.click();
	await expect(page.getByRole('radio', { name: 'Modern', exact: true })).toBeChecked();
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
	await trigger.click();
	await page.getByRole('radio', { name: 'Light', exact: true }).focus();
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
	await page.getByRole('button', { name: 'Apply appearance' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-appearance', 'dark');
	await trigger.click();
	await page.screenshot({ path: `test-results/appearance-dark-${test.info().project.name}.png` });
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await page.getByRole('button', { name: 'Close appearance' }).click();
});

test('fixed dark themes preserve Modern mode and ambient motion respects preferences', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/');
	const trigger = page.getByRole('button', { name: 'Appearance', exact: true });
	const apply = page.getByRole('button', { name: 'Apply appearance' });
	const canvas = page.locator('.ambient-background');
	await expect(canvas).toHaveAttribute('data-animating', 'false');
	await trigger.click();
	await page.getByRole('radio', { name: 'Dark', exact: true }).check();
	await apply.click();
	for (const theme of ['LCARS', 'Neon Noir', 'Matrix']) {
		await trigger.click();
		await page.getByRole('radio', { name: theme, exact: true }).check();
		await expect(apply).toBeInViewport({ ratio: 1 });
		for (const mode of ['Light', 'Dark', 'System'])
			await expect(page.getByRole('radio', { name: mode, exact: true })).toBeDisabled();
		await apply.click();
		await expect(page.locator('html')).toHaveAttribute('data-appearance', 'dark');
	}
	await expect(canvas).toHaveAttribute('data-animating', 'true');
	expect(await canvas.evaluate((c) => getComputedStyle(c).pointerEvents)).toBe('none');
	const initial = await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
	await expect
		.poll(() => canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL()))
		.not.toBe(initial);
	await page.screenshot({ path: `test-results/matrix-ambient-${test.info().project.name}.png` });
	await expect(canvas).toHaveAttribute('data-phase', 'idle', { timeout: 4000 });
	expect(
		await canvas.evaluate((c) => {
			const el = c as HTMLCanvasElement;
			const pixels = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data;
			return pixels.some((value, index) => index % 4 === 3 && value > 0);
		})
	).toBe(false);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await expect(canvas).toHaveAttribute('data-animating', 'false');
	await expect(canvas).toBeHidden();
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await expect(canvas).toHaveAttribute('data-animating', 'true');
	await trigger.click();
	await page.getByRole('checkbox', { name: 'Ambient motion' }).uncheck();
	await apply.click();
	await expect(canvas).toHaveAttribute('data-animating', 'false');
	await page.reload();
	await expect(canvas).toHaveAttribute('data-animating', 'false');
	await trigger.click();
	await expect(page.getByRole('checkbox', { name: 'Ambient motion' })).not.toBeChecked();
	await page.getByRole('radio', { name: 'Modern', exact: true }).check();
	await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeEnabled();
	await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
	await apply.click();
	await expect(canvas).toBeHidden();
	await expect(canvas).toHaveAttribute('data-animating', 'false');
});

test('Neon Noir cards open discussions and profiles', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Appearance', exact: true }).click();
	await page.getByRole('radio', { name: 'Neon Noir', exact: true }).check();
	await page.getByRole('button', { name: 'Apply appearance' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'noir');
	await expect(page.locator('.story-row').first()).toBeVisible();
	await page.locator('.comment-count').first().click();
	await expect(page.locator('.discussion-heading')).toBeVisible();
	await page.locator('.reading-page > .story-meta a').first().click();
	await expect(page.locator('.profile-stats')).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await page.screenshot({ path: `test-results/noir-profile-${test.info().project.name}.png` });
});

test('more stories preserves results and retries a partial batch without duplicates', async ({
	page,
	isMobile
}) => {
	await page.goto('/');
	const count = await page.locator('.story-row').count();
	let calls = 0;
	let batch = '';
	await page.route('**/api/stories?*', async (route) => {
		calls++;
		const ids = new URL(route.request().url()).searchParams.get('ids')!;
		if (calls === 1) batch = ids;
		else expect(ids).toBe(batch);
		await new Promise((resolve) => setTimeout(resolve, 250));
		if (calls === 1) return route.fulfill({ status: 503, body: 'offline' });
		const numbers = ids.split(',').map(Number);
		await route.fulfill({
			json: {
				items: numbers
					.slice(0, calls === 2 ? 2 : 30)
					.map((id) => ({ id, title: `Recovered ${id}`, time: 1 })),
				failed: calls === 2 ? 28 : 0
			}
		});
	});
	await page.getByRole('button', { name: 'More stories', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Loading stories…' })).toBeDisabled();
	await expect(page.getByText('Couldn’t load more stories. Please try again.')).toBeVisible();
	await expect(page.locator('.story-row')).toHaveCount(count);
	await page.getByRole('button', { name: 'Retry stories' }).click();
	await expect(page.locator('.story-row')).toHaveCount(count + 2);
	await expect(
		page.getByText('Some stories couldn’t be loaded. Retry to finish this batch.')
	).toBeVisible();
	const retry = page.getByRole('button', { name: 'Retry stories' });
	await retry.focus();
	await page.keyboard.press('Enter');
	await expect(page.locator('.story-row')).toHaveCount(count + 30);
	await expect(
		page
			.locator('.story-row')
			.nth(count + 2)
			.locator('h2 a')
	).toBeFocused();
	expect(calls).toBe(3);
	expect(
		await page.locator('.story-row').evaluateAll((rows) => new Set(rows.map((r) => r.id)).size)
	).toBe(count + 30);
	if (isMobile) await page.getByRole('button', { name: 'Toggle navigation' }).click();
	await page
		.getByRole('navigation', { name: 'Feeds' })
		.getByRole('link', { name: 'New', exact: true })
		.click();
	await expect(page).toHaveURL(/\/new$/);
	await expect(page.locator('.story-row')).toHaveCount(30);
});

test('font size and density persist and work independently across themes', async ({
	page,
	isMobile
}) => {
	if (isMobile) await page.setViewportSize({ width: 320, height: 640 });
	await page.goto('/');
	const root = page.locator('html');
	const title = page.locator('.story-heading h2').first();
	const row = page.locator('.story-row').first();
	const size = () => title.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
	const padding = () => row.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
	const open = () => page.getByRole('button', { name: 'Appearance', exact: true }).click();
	const choose = (name: string) => page.getByRole('radio', { name, exact: true }).check();
	const apply = () => page.getByRole('button', { name: 'Apply appearance' }).click();
	const medium = await size();
	const normal = await padding();
	if (isMobile) expect(medium).toBeGreaterThanOrEqual(17);
	await open();
	await expect(page.getByRole('radio', { name: 'Medium', exact: true })).toBeChecked();
	await expect(page.getByRole('radio', { name: 'Normal', exact: true })).toBeChecked();
	await choose('Small');
	await choose('Spacious');
	await apply();
	await expect(root).toHaveAttribute('data-font-size', 'small');
	await expect(root).toHaveAttribute('data-density', 'spacious');
	expect(await size()).toBeLessThan(medium);
	expect(await padding()).toBeGreaterThan(normal);

	for (const [name, id] of [
		['LCARS', 'lcars'],
		['Matrix', 'matrix'],
		['Neon Noir', 'noir']
	]) {
		await open();
		await expect(
			page.getByRole('radio', { name: id === 'lcars' ? 'Small' : 'Large', exact: true })
		).toBeChecked();
		await expect(
			page.getByRole('radio', { name: id === 'lcars' ? 'Spacious' : 'Compact', exact: true })
		).toBeChecked();
		await choose(name);
		await choose('Large');
		await choose('Compact');
		await apply();
		await expect(root).toHaveAttribute('data-theme', id);
		await expect(root).toHaveAttribute('data-font-size', 'large');
		await expect(root).toHaveAttribute('data-density', 'compact');
		expect(await size()).toBeGreaterThan(medium);
		expect(await padding()).toBeLessThan(normal);
		if (isMobile) await page.getByRole('button', { name: 'Toggle navigation' }).click();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
			await page.evaluate(() => innerWidth)
		);
	}
	await page.reload();
	await expect(root).toHaveAttribute('data-font-size', 'large');
	await expect(root).toHaveAttribute('data-density', 'compact');
	await open();
	await choose('Medium');
	await choose('Normal');
	await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	await open();
	await expect(page.getByRole('radio', { name: 'Large', exact: true })).toBeChecked();
	await expect(page.getByRole('radio', { name: 'Compact', exact: true })).toBeChecked();
});

test('compact mobile feeds fit more stories and keep discussion links accessible', async ({
	page,
	isMobile
}) => {
	test.skip(!isMobile, 'Narrow feed layout');
	await page.setViewportSize({ width: 460, height: 840 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Appearance', exact: true }).click();
	await page.getByRole('radio', { name: 'Small', exact: true }).check();
	await page.getByRole('radio', { name: 'Compact', exact: true }).check();
	await page.getByRole('button', { name: 'Apply appearance' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');

	const heights = await page.locator('.story-row').evaluateAll((rows) => {
		const first = rows[0];
		const measure = () => {
			const top = first.getBoundingClientRect().top;
			return {
				height: rows[14].getBoundingClientRect().bottom - top,
				visible: rows.filter((row) => row.getBoundingClientRect().bottom - top <= innerHeight)
					.length
			};
		};
		const compact = measure();
		document.documentElement.dataset.density = 'normal';
		const normal = measure();
		document.documentElement.dataset.density = 'compact';
		return { compact, normal };
	});
	expect(heights.compact.height).toBeLessThan(heights.normal.height * 0.7);
	console.info(
		`Stories per 840px from first row: ${heights.compact.visible} compact, ${heights.normal.visible} normal`
	);

	const first = page.locator('.story-row').first();
	await expect(first.locator('.comment-count')).toBeHidden();
	await first.getByRole('link', { name: /comments on / }).click();
	await expect(page.locator('.discussion-heading')).toBeVisible();
});
