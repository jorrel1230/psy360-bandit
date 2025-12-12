<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';

	interface LeaderboardEntry {
		netid: string;
		final_balance: number;
		total_trials: number;
		session_completed: boolean;
	}

	let entries: LeaderboardEntry[] = [];
	let isLoading = true;
	let error = '';
	let highlightedPlayer = '';

	onMount(async () => {
		// Get player to highlight from URL parameter
		highlightedPlayer = $page.url.searchParams.get('player') || '';
		await loadLeaderboard();
	});

	async function loadLeaderboard() {
		try {
			const { data, error: supabaseError } = await supabase
				.from('scores')
				.select('netid, data')
				.order('created_at', { ascending: false });

			if (supabaseError) {
				console.error('Leaderboard error:', supabaseError);
				error = 'Failed to load leaderboard. Please try again.';
				return;
			}

			if (data) {
				entries = data
					.map(item => ({
						netid: item.netid,
						final_balance: item.data?.final_balance || 0,
						total_trials: item.data?.total_trials || 0,
						session_completed: item.data?.session_completed || false
					}))
					.filter(entry => entry.session_completed) // Filter completed sessions client-side
					.sort((a, b) => b.final_balance - a.final_balance); // Sort by final balance descending
			}
		} catch (err) {
			console.error('Unexpected leaderboard error:', err);
			error = 'Failed to load leaderboard. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function startNewGame() {
		goto(base || '/');
	}

	function formatCurrency(amount: number): string {
		return `$${amount.toFixed(2)}`;
	}
</script>

<div class="min-h-screen bg-gray-900 py-8">
	<div class="container mx-auto px-4">
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-white mb-2">Leaderboard</h1>
			<p class="text-gray-300">Top performers in the Multi-Armed Bandit experiment</p>
		</div>

		{#if isLoading}
			<div class="text-center">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
				<p class="text-gray-300 mt-4">Loading leaderboard...</p>
			</div>
		{:else if error}
			<div class="max-w-2xl mx-auto">
				<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
					{error}
				</div>
				<div class="text-center mt-6">
					<button
						on:click={loadLeaderboard}
						class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		{:else if entries.length === 0}
			<div class="text-center text-gray-300">
				<p class="text-xl mb-4">No completed games yet.</p>
				<p class="text-gray-400">Be the first to complete the experiment!</p>
			</div>
		{:else}
			<div class="max-w-4xl mx-auto">
				<div class="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-gray-700">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Final Balance</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trials</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-700">
								{#each entries as entry, index}
									<tr class="transition-colors {highlightedPlayer && entry.netid === highlightedPlayer ? 'bg-blue-800 bg-opacity-50' : 'hover:bg-gray-700'}">
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="flex items-center">
												{#if index < 3}
													<span class="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
														{index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-400 text-black' : 'bg-yellow-600 text-white'}">
														{index + 1}
													</span>
												{:else}
													<span class="text-gray-300 text-sm font-medium">{index + 1}</span>
												{/if}
											</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-white font-medium">
												{entry.netid}
												{#if highlightedPlayer && entry.netid === highlightedPlayer}
													<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
														You
													</span>
												{/if}
											</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span class="text-lg font-semibold {entry.final_balance >= 200 ? 'text-green-400' : entry.final_balance >= 100 ? 'text-yellow-400' : 'text-red-400'}">
												{formatCurrency(entry.final_balance)}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-gray-300">
											{entry.total_trials}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/if}

		<div class="text-center mt-8">
			<button
				on:click={startNewGame}
				class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				Start New Game
			</button>
		</div>
	</div>
</div>