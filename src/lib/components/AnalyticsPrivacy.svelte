<script lang="ts">
	import { setAnalyticsEnabled } from '#lib/analytics';
	import Icon from './Icon.svelte';

	let { choice, returnTo }: { choice: string | null; returnTo: string } = $props();
	let dialog: HTMLDialogElement;
	const needsChoice = $derived(choice !== 'yes' && choice !== 'no');

	function onsubmit(event: SubmitEvent) {
		if ((event.submitter as HTMLButtonElement | null)?.value === 'no') setAnalyticsEnabled(false);
	}
</script>

{#snippet choices()}
	<form class="analytics-choices" action="/analytics/preference" method="POST" {onsubmit}>
		<input type="hidden" name="returnTo" value={returnTo} />
		<button class="secondary" name="choice" value="no">
			{choice === 'yes' ? 'Turn off analytics' : 'Decline'}
		</button>
		{#if choice !== 'yes'}
			<button class="secondary" name="choice" value="yes">Allow analytics</button>
		{/if}
	</form>
{/snippet}

<button class="privacy-link" type="button" onclick={() => dialog.showModal()}
	>Analytics privacy</button
>
<dialog
	class="appearance-dialog analytics-dialog"
	bind:this={dialog}
	aria-labelledby="analytics-title"
>
	<header class="appearance-heading">
		<h2 id="analytics-title">Optional analytics</h2>
		<button
			class="dialog-close"
			type="button"
			aria-label="Close analytics settings"
			onclick={() => dialog.close()}
		>
			<Icon name="close" size={20} />
		</button>
	</header>
	<p>
		Help us understand which screens and features get used. If you allow analytics, Warped HN sends
		those categories and a temporary session identifier to Google Analytics through our server.
		Google doesn’t receive the stories you read or save, usernames, or your browser’s IP address
		from this integration.
	</p>
	<p>You can change this choice here any time.</p>
	{@render choices()}
</dialog>

{#if needsChoice}
	<section class="analytics-notice" aria-label="Optional analytics">
		<p>
			Allow optional usage statistics? We count screens and features without sending what you read
			or save.
		</p>
		{@render choices()}
	</section>
{/if}
