import { test, expect } from '@playwright/test';
test('reads stories, profiles and pagination', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Stay curious.' })).toBeVisible();
	await expect(page.locator('.brand-sub')).toHaveText('engaged');
	await expect(page).toHaveTitle(/Warped Hacker News, engaged/);
	await expect(page.locator('.story-row').first()).toBeVisible();
	await page.getByRole('link', { name: 'More stories', exact: true }).click();
	await expect(page).toHaveURL(/page=2/);
	await expect(page.locator('.story-rank').first()).toHaveText('31');
	await page.locator('.comment-count').first().click();
	await expect(page.locator('.discussion-heading')).toBeVisible();
	const author = page.locator('.reading-page > .story-meta a').first();
	if (await author.count()) {
		await author.click();
		await expect(page.locator('.profile-stats')).toBeVisible();
	}
});
test('themes persist and stay within mobile viewport', async ({ page }) => {
	await page.goto('/');
	for (const theme of ['lcars', 'matrix', 'modern']) {
		await page.getByRole('button', { name: 'Appearance', exact: true }).click();
		await page
			.getByRole('radio', {
				name: theme === 'lcars' ? 'LCARS' : theme === 'matrix' ? 'Matrix' : 'Modern',
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
