<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import {
		themes,
		fontSizes,
		accentPalettes,
		darkAccent,
		getAccent,
		type Accents,
		densities,
		type FontSize,
		type Density,
		type Theme,
		type Appearance
	} from '#lib/themes';
	import Icon from './Icon.svelte';
	let {
		accents,
		fontSize,
		density,
		theme,
		motion,
		appearance,
		returnTo
	}: {
		accents: Accents;
		fontSize: FontSize;
		density: Density;
		theme: Theme;
		motion: boolean;
		appearance: Appearance;
		returnTo: string;
	} = $props();
	let dialog: HTMLDialogElement;
	let ready = $state(false);
	let open = $state(false);
	let selectedAccents = $state(untrack(() => ({ ...accents })));
	let selectedFontSize = $state(untrack(() => fontSize));
	let selectedDensity = $state(untrack(() => density));
	let selectedMotion = $state(untrack(() => motion));
	let selectedTheme = $state(untrack(() => theme));
	let selectedAppearance = $state(untrack(() => appearance));
	const previewAccent = $derived(
		selectedTheme === 'modern' || selectedTheme === 'noir'
			? getAccent(selectedTheme, selectedAccents[selectedTheme])
			: null
	);
	const accentThemes = ['modern', 'noir'] as const;
	const appearances = [
		{ id: 'light', name: 'Light', icon: 'sun' },
		{ id: 'dark', name: 'Dark', icon: 'moon' },
		{ id: 'system', name: 'System', icon: 'monitor' }
	] as const;
	onMount(() => {
		ready = true;
	});
	function show() {
		selectedAccents = { ...accents };
		selectedFontSize = fontSize;
		selectedDensity = density;
		selectedMotion = motion;
		selectedTheme = theme;
		selectedAppearance = appearance;
		dialog.showModal();
		open = true;
	}
	function backdrop(event: PointerEvent) {
		if (event.target !== dialog) return;
		const r = dialog.getBoundingClientRect();
		if (
			event.clientX < r.left ||
			event.clientX > r.right ||
			event.clientY < r.top ||
			event.clientY > r.bottom
		)
			dialog.close();
	}
</script>

<button
	class="appearance-button"
	disabled={!ready}
	aria-label="Appearance"
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-controls="appearance-dialog"
	title="Appearance"
	onclick={show}><Icon name="sun" size={20} /></button
>
<dialog
	bind:this={dialog}
	id="appearance-dialog"
	class="appearance-dialog"
	aria-labelledby="appearance-title"
	aria-describedby="appearance-description"
	onclose={() => (open = false)}
	onpointerdown={backdrop}
>
	<header class="appearance-heading">
		<div>
			<span class="eyebrow">Your reading space</span>
			<h2 id="appearance-title">Make it yours.</h2>
		</div>
		<button
			class="dialog-close"
			type="button"
			aria-label="Close appearance"
			onclick={() => dialog.close()}><Icon name="close" size={20} /></button
		>
	</header>
	<p id="appearance-description" class="appearance-description">
		The same curious community. A different atmosphere.
	</p>
	<form
		action="/appearance"
		method="POST"
		data-preview-mode={selectedTheme === 'modern' ? selectedAppearance : 'dark'}
		style:--preview-light={previewAccent?.swatch}
		style:--preview-dark={previewAccent ? darkAccent(previewAccent) : undefined}
	>
		<input type="hidden" name="returnTo" value={returnTo} />
		<div class="appearance-form-body">
			<fieldset class="theme-fieldset">
				<legend>Choose your theme</legend>
				<div class="theme-options">
					{#each themes as choice}<label class="theme-option"
							><input
								type="radio"
								name="theme"
								value={choice.id}
								bind:group={selectedTheme}
								aria-label={choice.name}
								aria-describedby={`theme-description-${choice.id}`}
							/><span class="theme-option-icon"><Icon name={choice.icon} size={22} /></span><span
								class="theme-option-copy"
								><strong>{choice.name}</strong><span id={`theme-description-${choice.id}`}
									>{choice.description}</span
								></span
							><span class="choice-indicator"><Icon name="check" size={13} /></span></label
						>{/each}
				</div>
			</fieldset>

			<fieldset class="appearance-fieldset" disabled={selectedTheme !== 'modern'}>
				<legend>Color mode <span>Modern theme</span></legend>
				<div class="appearance-segments">
					{#each appearances as mode}<label
							><input
								type="radio"
								name="appearance"
								value={mode.id}
								bind:group={selectedAppearance}
								aria-label={mode.name}
							/><Icon name={mode.icon} size={17} /><span>{mode.name}</span></label
						>{/each}
				</div>
				<p class="appearance-hint">
					{selectedTheme === 'modern'
						? 'System follows your device’s light or dark setting.'
						: 'This theme has its own dark palette. Your color mode is saved for Modern.'}
				</p>
			</fieldset>
			{#if selectedTheme !== 'modern'}<input
					type="hidden"
					name="appearance"
					value={selectedAppearance}
				/>{/if}
			{#each accentThemes as accentTheme}
				{#if selectedTheme === accentTheme}
					<fieldset>
						<legend>Accent color</legend>
						<div class="accent-options">
							{#each accentPalettes[accentTheme] as color}
								<label>
									<input
										type="radio"
										name={`${accentTheme}Accent`}
										value={color.id}
										checked={selectedAccents[accentTheme] === color.id}
										onchange={() =>
											(selectedAccents = { ...selectedAccents, [accentTheme]: color.id })}
									/>
									<span
										class="accent-swatch"
										style:--preview-light={color.swatch}
										style:--preview-dark={darkAccent(color)}
									></span>
									<span>{color.name}</span>
								</label>
							{/each}
						</div>
					</fieldset>
				{:else}
					<input type="hidden" name={`${accentTheme}Accent`} value={selectedAccents[accentTheme]} />
				{/if}
			{/each}
			<fieldset>
				<legend>Font size</legend>
				<div class="appearance-segments">
					{#each fontSizes as size}<label
							><input
								type="radio"
								name="fontSize"
								value={size}
								bind:group={selectedFontSize}
							/><span>{size[0].toUpperCase() + size.slice(1)}</span></label
						>{/each}
				</div>
			</fieldset>
			<fieldset>
				<legend>Density</legend>
				<div class="appearance-segments">
					{#each densities as density}<label
							><input
								type="radio"
								name="density"
								value={density}
								bind:group={selectedDensity}
							/><span>{density[0].toUpperCase() + density.slice(1)}</span></label
						>{/each}
				</div>
				<p class="appearance-hint">Adjust the space between stories and comments.</p>
			</fieldset>
			{#if selectedTheme === 'matrix'}
				<label class="motion-setting"
					><span
						><strong>Ambient motion</strong><small
							>Faint character rain. Device motion preferences take priority.</small
						></span
					><input
						type="checkbox"
						name="motion"
						value="on"
						bind:checked={selectedMotion}
						aria-label="Ambient motion"
					/><span class="motion-switch" aria-hidden="true"></span></label
				>
			{:else}<input type="hidden" name="motion" value={selectedMotion ? 'on' : 'off'} />{/if}
		</div>
		<div class="appearance-actions">
			<button class="dialog-cancel" type="button" onclick={() => dialog.close()}>Cancel</button
			><button class="primary" class:accent-preview={previewAccent !== null} type="submit"
				>Apply appearance <Icon name="arrow" size={16} /></button
			>
		</div>
	</form>
</dialog>
