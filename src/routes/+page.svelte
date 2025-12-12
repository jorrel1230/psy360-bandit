<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { supabase } from '$lib/supabase';

	let netid = '';
	let isValidating = false;
	let validationError = '';

	function handleSubmit() {
		if (netid.trim()) {
			validateAndStartGame();
		}
	}

	async function validateAndStartGame() {
		if (!netid.trim()) return;

		isValidating = true;
		validationError = '';

		try {
			// Check if name already exists
			const { data, error } = await supabase
				.from('scores')
				.select('netid')
				.eq('netid', netid.trim())
				.limit(1);

			if (error) {
				console.error('Validation error:', error);
				validationError = 'Unable to validate name. Please try again.';
				return;
			}

			if (data && data.length > 0) {
				validationError = 'This name is already taken. Please choose a different name.';
				return;
			}

			// Name is unique, proceed to game
			goto(`${base}/game?netid=${encodeURIComponent(netid.trim())}`);
		} catch (error) {
			console.error('Unexpected validation error:', error);
			validationError = 'Unable to validate name. Please try again.';
		} finally {
			isValidating = false;
		}
	}

	function viewLeaderboard() {
		goto(`${base}/leaderboard`);
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-900">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-white mb-2">Multi-Armed Bandit</h1>
			<h2 class="text-2xl font-semibold text-gray-300 mb-8">
				Experiment
			</h2>
			<div class="text-gray-400 mb-8 space-y-4">
				<p>
					This is an experiment that will be testing you in the classical "Multi-Armed Bandit" Problem.
				</p>
				<p>
					Imagine you have found $200 on the side of the road and want to try your luck at the casino. This casino only has 6 slot machines for you to play, and you don't have much time. Each slot machine is different: they each have a different cost to play, a different probability of winning, and different win sizes. Naturally, the casino won't tell you any of this highly secret information. Your task is simple: try to win the most money!
				</p>
				<p>
					If you would like to take the experiment multiple times, we ask that you please use the same nickname for data reliability. Good luck!
				</p>
			</div>
		</div>

		<div class="bg-gray-800 rounded-lg p-8 shadow-xl">
			<h3 class="text-xl font-semibold text-white mb-6 text-center">
				Enter Your Name to Begin
			</h3>
			<form class="space-y-6" on:submit|preventDefault={handleSubmit}>
				<div>
					<label for="netid" class="block text-sm font-medium text-gray-300 mb-2">Name</label>
					<input
						id="netid"
						name="netid"
						type="text"
						required
						bind:value={netid}
						disabled={isValidating}
						class="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 disabled:opacity-50"
						placeholder="Enter your name"
					/>
					{#if validationError}
						<p class="mt-2 text-sm text-red-400">{validationError}</p>
					{/if}
				</div>
				<button
					type="submit"
					disabled={isValidating}
					class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{isValidating ? 'Checking...' : 'Start Experiment'}
				</button>
			</form>

			<div class="mt-6 pt-6 border-t border-gray-700">
				<button
					on:click={viewLeaderboard}
					class="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
				>
					View Leaderboard
				</button>
			</div>
		</div>
	</div>
</div>
