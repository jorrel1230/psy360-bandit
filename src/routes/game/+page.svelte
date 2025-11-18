<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';

	let netid = '';
	let diceResult = 0;
	let isSubmitting = false;
	let errorMessage = '';
	let isRolling = false;

	onMount(() => {
		netid = $page.url.searchParams.get('netid') || '';
		if (!netid) {
			goto('/');
			return;
		}
		rollDice();
	});

	function rollDice() {
		isRolling = true;
		errorMessage = '';

		let rollCount = 0;
		const maxRolls = 20;
		let interval = 50; // Start fast

		function animateRoll() {
			diceResult = Math.floor(Math.random() * 6) + 1;
			rollCount++;

			if (rollCount >= maxRolls) {
				// Final result
				diceResult = Math.floor(Math.random() * 6) + 1;
				isRolling = false;
				return;
			}

			// Gradually slow down
			interval = interval + (rollCount * 10);
			setTimeout(animateRoll, interval);
		}

		animateRoll();
	}

	async function submitScore() {
		if (isRolling) return; // Prevent submission during roll

		isSubmitting = true;
		errorMessage = '';

		try {
			const { error } = await supabase
				.from('scores')
				.insert({
					netid,
					data: { score: diceResult }
				});

			if (error) {
				console.error('Supabase error:', error);
				errorMessage = 'Failed to submit score. Please try again.';
			} else {
				goto('/success');
			}
		} catch (error) {
			console.error('Error submitting score:', error);
			errorMessage = 'Failed to submit score. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Game Time!
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Player: {netid}
			</p>
		</div>

		<div class="text-center">
			<div class="inline-flex items-center justify-center w-32 h-32 bg-white border-2 border-gray-300 rounded-lg shadow-lg {isRolling ? 'animate-pulse' : ''}">
				<span class="text-6xl font-bold text-indigo-600">
					{diceResult}
				</span>
			</div>
			<p class="mt-4 text-lg text-gray-700">
				{#if isRolling}
					Rolling...
				{:else}
					You rolled a {diceResult}!
				{/if}
			</p>
		</div>

		<div class="space-y-4">
			{#if errorMessage}
				<div class="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
					{errorMessage}
				</div>
			{/if}

			<button
				type="button"
				on:click={rollDice}
				disabled={isRolling || isSubmitting}
				class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
			>
				{isRolling ? 'Rolling...' : 'Roll Again'}
			</button>

			<button
				type="button"
				on:click={submitScore}
				disabled={isSubmitting || isRolling}
				class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
			>
				{isSubmitting ? 'Submitting...' : 'Submit Score'}
			</button>
		</div>
	</div>
</div>
