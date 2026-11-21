import { expect, test } from '@playwright/test';

const ranked = Array.from({ length: 80 }, (_, index) => 1000 + index);
const newStory = 999;
const anchor = 1046;

test('Home Screen launch restores a deep story and signals truly new stories above', async ({
	page
}) => {
	await page.addInitScript(
		({ ranked, anchor }) => {
			localStorage.setItem(
				'whn-reading-position-v1',
				JSON.stringify({
					feed: 'new',
					at: Date.now() - 30 * 60_000,
					anchors: [anchor, anchor + 1],
					offset: 8,
					ids: ranked
				})
			);
		},
		{ ranked, anchor }
	);
	await page.route('**/api/feed/new?*', async (route) => {
		const query = new URL(route.request().url()).searchParams;
		const list = [newStory, ...ranked];
		const start = query.has('anchors') ? list.indexOf(anchor) - 10 : 0;
		const items = list.slice(start, start + 30).map((id) => ({ id, title: `Story ${id}` }));
		await route.fulfill({
			json: {
				ids: list,
				items,
				start,
				end: start + 30,
				failed: 0,
				anchorId: start ? anchor : undefined
			}
		});
	});
	await page.goto('/?launch=1');
	await expect(page).toHaveURL(/\/new$/);
	const restored = page.locator(`#story-${anchor}`);
	await expect(restored).toBeInViewport();
	await expect
		.poll(() =>
			restored.evaluate((el) =>
				Math.round(
					el.getBoundingClientRect().top -
						document.querySelector('.site-header')!.getBoundingClientRect().bottom
				)
			)
		)
		.toBe(8);
	await page.route('**/api/stories?*', async (route) => {
		const ids = new URL(route.request().url()).searchParams.get('ids')!.split(',').map(Number);
		await route.fulfill({
			json: { items: ids.map((id) => ({ id, title: `Story ${id}` })), failed: 0 }
		});
	});
	await page.getByRole('button', { name: 'Earlier stories' }).click();
	await expect(page.locator('#story-1006')).toHaveCount(1);
	await page.getByRole('button', { name: /New stories above/ }).click();
	await expect(page.locator(`#story-${newStory}`)).toBeVisible();
	await expect(page.getByRole('button', { name: /New stories above/ })).toBeHidden();
});

test('Home Screen launch discards a feed position after an hour', async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem(
			'whn-reading-position-v1',
			JSON.stringify({
				feed: 'new',
				at: Date.now() - 61 * 60_000,
				anchors: [1046],
				offset: 8,
				ids: [1046]
			})
		);
	});
	await page.goto('/?launch=1');
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole('heading', { name: 'Stay curious.' })).toBeVisible();
});

test('refresh preserves stories on failure and offers a successful retry', async ({ page }) => {
	await page.goto('/');
	const existing = page.locator('.story-row').first();
	const title = await existing.locator('h2').innerText();
	let requests = 0;
	await page.route('**/api/feed/top?*', async (route) => {
		requests++;
		if (requests === 1) return route.fulfill({ status: 503 });
		return route.fulfill({
			json: { ids: [1], items: [{ id: 1, title: 'A fresh story' }], failed: 0, start: 0, end: 1 }
		});
	});
	await page.getByRole('button', { name: 'Refresh', exact: true }).click();
	await expect(page.getByText('Couldn’t refresh the feed. Try again.')).toBeVisible();
	await expect(existing.locator('h2')).toHaveText(title);
	await page.getByRole('button', { name: 'Retry refresh' }).click();
	await expect(page.getByRole('heading', { name: 'A fresh story' })).toBeVisible();
	expect(requests).toBe(2);
});

test('refresh the active feed on foreground return after five minutes, and offer a build update', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Appearance', exact: true })).toBeEnabled();
	const time = await page.evaluate(() => Date.now());
	await page.route('**/api/feed/top?*', (route) =>
		route.fulfill({
			json: {
				ids: [1],
				items: [{ id: 1, title: 'Foreground story' }],
				failed: 0,
				start: 0,
				end: 1
			}
		})
	);
	await page.route('**/api/version', (route) =>
		route.fulfill({ json: { revision: 'future', builtAt: 'future' } })
	);
	await page.evaluate(() => {
		Object.defineProperty(document, 'hidden', { configurable: true, value: true });
		document.dispatchEvent(new Event('visibilitychange'));
	});
	await page.clock.setFixedTime(time + 6 * 60_000);
	await page.evaluate(() => {
		Object.defineProperty(document, 'hidden', { configurable: true, value: false });
		document.dispatchEvent(new Event('visibilitychange'));
	});
	await expect(page.getByRole('heading', { name: 'Foreground story' })).toBeVisible();
	await expect(page.getByRole('button', { name: /Update available/ })).toBeVisible();
});

test('save from a feed, see the same saved state in discussions, and remove after reload', async ({
	page
}) => {
	await page.goto('/');
	const first = page.locator('.story-row').first();
	const title = await first.locator('h2').innerText();
	await first.getByRole('button', { name: /^Save for later:/ }).click();
	await expect(first.getByRole('button', { name: /^Remove from Saved:/ })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await first.locator('.comment-count').click();
	await expect(page.getByRole('button', { name: /^Remove from Saved:/ })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await page.getByRole('link', { name: 'Saved', exact: true }).click();
	await expect(page).toHaveURL(/\/saved$/);
	await page.reload();
	await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Discussion', exact: true })).toHaveCount(1);
	await page.getByRole('button', { name: /^Remove from Saved:/ }).click();
	await expect(page.getByText(/No saved stories yet/)).toBeVisible();
});

test('pulling down from the top refreshes the feed on touch', async ({ page, isMobile }) => {
	test.skip(!isMobile, 'Touch gesture');
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Appearance', exact: true })).toBeEnabled();
	await page.route('**/api/feed/top?*', (route) =>
		route.fulfill({
			json: {
				ids: [1],
				items: [{ id: 1, title: 'Pulled story' }],
				failed: 0,
				start: 0,
				end: 1
			}
		})
	);
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('Input.dispatchTouchEvent', {
		type: 'touchStart',
		touchPoints: [{ x: 180, y: 255 }]
	});
	await cdp.send('Input.dispatchTouchEvent', {
		type: 'touchMove',
		touchPoints: [{ x: 180, y: 365 }]
	});
	await expect(page.locator('.pull-refresh')).toHaveText('Release to refresh');
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
	await expect(page.getByRole('heading', { name: 'Pulled story' })).toBeVisible();
});

test('an idle installed feed reloads once when a new build is found', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'standalone', { value: true, configurable: true });
	});
	let launches = 0;
	page.on('request', (request) => {
		if (request.isNavigationRequest() && new URL(request.url()).pathname === '/') launches++;
	});
	let versionChecks = 0;
	await page.route('**/api/version', (route) => {
		versionChecks++;
		return route.fulfill({ json: { revision: 'new-build', builtAt: 'new-build' } });
	});
	await page.goto('/');
	await expect.poll(() => versionChecks).toBe(2);
	await expect(page.getByRole('button', { name: /Update available/ })).toBeVisible();
	expect(launches).toBe(2);
});
