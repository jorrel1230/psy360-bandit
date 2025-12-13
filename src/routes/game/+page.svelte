<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import BanditArm from '$lib/components/BanditArm.svelte';

	interface BanditResult {
		machineId: number;
		mean: number;
		variance: number;
		betAmount: number;
		payout: number;
		netGain: number;
		timestamp: Date;
	}

	let netid = '';
	let isSubmitting = false;
	let errorMessage = '';
	let balance = 200; // Starting balance
	let results: BanditResult[] = [];

	// Experiment parameters
	const T = 100; // Total number of trials
	let trialsRemaining = T;
	let choices: number[] = []; // Array of machine IDs chosen (as integers)
	let payoffs: number[] = []; // Array of payoffs received
	let sessionComplete = false;

	const machines = [
		// Gaussian machine with moderate variance
		// Expected profit: +$2.00
		{ id: 1, label: 'A', mean: 22.0, variance: 12.0, cost: 20, color: '#e74c3c' },

		// Gaussian machine with moderate variance
		// Expected profit: -$2.00
		{ id: 2, label: 'B', mean: 16.0, variance: 8.0, cost: 18, color: '#2ecc71' },

		// Safe gaussian machine with very low variance
		// Expected profit: +$0.50
		{ id: 3, label: 'C', mean: 15.5, variance: 0.1, cost: 15, color: '#f39c12' },

		// High-risk bimodal machine (80% small win, 20% big win)
		// Expected profit: +$3.00
		{ id: 4, label: 'D', bimodal: true, mean1: 10.0, mean2: 100.0, variance1: 2.0, variance2: 10.0, weight1: 0.8, cost: 25, color: '#e67e22' },

		// Moderate-risk bimodal machine (65% small win, 35% medium win)
		// Expected profit: +$0.50
		{ id: 5, label: 'E', bimodal: true, mean1: 10.0, mean2: 40.0, variance1: 2.5, variance2: 2.5, weight1: 0.65, cost: 20, color: '#34495e' },

		// Very high-risk bimodal machine (75% tiny win, 25% huge win)
		// Expected profit: -$1.25
		{ id: 6, label: 'F', bimodal: true, mean1: 5.0, mean2: 80.0, variance1: 4.0, variance2: 4.0, weight1: 0.75, cost: 25, color: '#95a5a6' }
	];

	// Shuffled machines for display (randomized order per visitor)
	let shuffledMachines = [...machines];

	// Fisher-Yates shuffle algorithm
	function shuffleArray(array: any[]) {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	onMount(() => {
		netid = $page.url.searchParams.get('netid') || '';
		if (!netid) {
			goto(base || '/');
			return;
		}

		// Shuffle machines for this visitor
		shuffledMachines = shuffleArray(machines);
	});

	async function handlePull(result: BanditResult) {
		if (trialsRemaining <= 0 || sessionComplete) return;

		// Update local state
		results = [result, ...results];
		balance += result.netGain;
		trialsRemaining--;

		// Add to research data arrays
		choices.push(result.machineId);
		payoffs.push(result.payout);

		// Check if session is complete
		if (trialsRemaining <= 0) {
			sessionComplete = true;
			await submitFinalData();
		}
	}

	async function submitFinalData() {
		isSubmitting = true;
		try {
			const { error } = await supabase
				.from('scores')
				.insert({
					netid,
					data: {
						choices: choices,
						payoffs: payoffs,
						total_trials: T,
						final_balance: balance,
						session_completed: true,
						timestamp: new Date().toISOString()
					}
				});

			if (error) {
				console.error('Supabase error:', error);
				errorMessage = 'Failed to save session data. Please try again.';
			} else {
				// Auto-redirect to leaderboard page with player highlighting after brief delay
				setTimeout(() => {
					goto(`${base}/leaderboard?player=${encodeURIComponent(netid)}`);
				}, 2000);
			}
		} catch (error) {
			console.error('Error saving session:', error);
			errorMessage = 'Failed to save session data. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	function finishSession() {
		isSubmitting = true;
		goto(`${base}/success`);
	}
</script>

<div class="min-h-screen bg-gray-900 py-8">
	<div class="container mx-auto px-4">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-white mb-2">Multi-Armed Bandit</h1>
			<p class="text-gray-300">Player: {netid}</p>
		</div>

		<!-- Stats Dashboard -->
		<div class="bg-gray-800 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
			<div class="grid grid-cols-4 gap-6 text-center">
				<div>
					<div class="text-2xl font-bold text-orange-400">{trialsRemaining}</div>
					<div class="text-gray-400 text-sm">Trials Left</div>
				</div>
				<div>
					<div class="text-2xl font-bold text-green-400">${balance.toFixed(2)}</div>
					<div class="text-gray-400 text-sm">Balance</div>
				</div>
				<div>
					<div class="text-2xl font-bold text-blue-400">{T - trialsRemaining}</div>
					<div class="text-gray-400 text-sm">Completed</div>
				</div>
				<div>
					<div class="text-2xl font-bold text-purple-400">
						{results.length > 0 ? (balance - 200).toFixed(2) : '0.00'}
					</div>
					<div class="text-gray-400 text-sm">Net P&L</div>
				</div>
			</div>

			<!-- Progress Bar -->
			<div class="mt-4">
				<div class="bg-gray-700 rounded-full h-2">
					<div
						class="bg-orange-500 h-2 rounded-full transition-all duration-300"
						style="width: {((T - trialsRemaining) / T) * 100}%"
					></div>
				</div>
				<div class="text-center text-gray-400 text-xs mt-1">
					{T - trialsRemaining} of {T} trials completed
				</div>
			</div>
		</div>

		<!-- Error Message -->
		{#if errorMessage}
			<div class="max-w-2xl mx-auto mb-6">
				<div class="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
					{errorMessage}
				</div>
			</div>
		{/if}

		<!-- Bandit Arms -->
		<div class="flex flex-wrap justify-center gap-8 mb-8">
			{#each shuffledMachines as machine, index}
				<BanditArm
					mean={machine.mean || 0}
					variance={machine.variance || 1}
					machineId={machine.id}
					machineLabel={String.fromCharCode(65 + index)}
					betAmount={machine.cost || 10}
					onPull={handlePull}
					disabled={sessionComplete || trialsRemaining <= 0}
					bimodal={machine.bimodal || false}
					mean1={machine.mean1 || 0}
					mean2={machine.mean2 || 0}
					variance1={machine.variance1 || 1}
					variance2={machine.variance2 || 1}
					weight1={machine.weight1 || 0.5}
				/>
			{/each}
		</div>

		<!-- Session Complete Message -->
		{#if sessionComplete}
			<div class="max-w-2xl mx-auto bg-green-800 rounded-lg p-6 mb-8 text-center">
				<h3 class="text-2xl font-bold text-white mb-2">Session Complete!</h3>
				<p class="text-green-200 mb-4">
					You completed all {T} trials. Your data has been saved.
				</p>
				<p class="text-green-300">
					{#if isSubmitting}
						Saving data and redirecting...
					{:else}
						Redirecting to results page...
					{/if}
				</p>
			</div>
		{/if}

		<!-- Recent Results -->
		{#if results.length > 0 && !sessionComplete}
			<div class="max-w-2xl mx-auto bg-gray-800 rounded-lg p-6 mb-8">
				<h3 class="text-xl font-bold text-white mb-4">Recent Results</h3>
				<div class="space-y-2 max-h-48 overflow-y-auto">
					{#each results.slice(0, 5) as result}
						<div class="flex justify-between items-center bg-gray-700 rounded p-3">
							<div class="flex items-center gap-3">
								<span class="font-bold text-white">
									Machine {String.fromCharCode(65 + shuffledMachines.findIndex(m => m.id === result.machineId))}
								</span>
								<span class="text-gray-300">${result.payout.toFixed(2)}</span>
							</div>
							<span
								class="font-bold {result.netGain >= 0 ? 'text-green-400' : 'text-red-400'}"
							>
								{result.netGain >= 0 ? '+' : ''}${result.netGain.toFixed(2)}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

	</div>
</div>
