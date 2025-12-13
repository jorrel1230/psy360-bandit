<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { supabase } from '$lib/supabase';
	import Chart from 'chart.js/auto';

	interface PlayerData {
		netid: string;
		choices: number[];
		payoffs: number[];
		total_trials: number;
		final_balance: number;
		session_completed: boolean;
		timestamp: string;
	}

	let players: string[] = [];
	let selectedPlayer = '';
	let playerData: PlayerData | null = null;
	let isLoading = false;
	let error = '';

	// Chart data
	let balanceHistory: number[] = [];
	let machineUsage: { [key: number]: number } = {};
	let payoffHistogram: { range: string; count: number }[] = [];

	// Chart instances
	let balanceChart: Chart | null = null;
	let machineChart: Chart | null = null;
	let payoffChart: Chart | null = null;

	onMount(async () => {
		await loadPlayers();
	});

	async function loadPlayers() {
		try {
			const { data, error: supabaseError } = await supabase
				.from('scores')
				.select('netid, data')
				.order('created_at', { ascending: false });

			if (supabaseError) {
				console.error('Error loading players:', supabaseError);
				error = 'Failed to load players';
				return;
			}

			if (data) {
				// Filter for completed sessions client-side and get unique player names
				const completedPlayers = data
					.filter(item => item.data?.session_completed === true)
					.map(item => item.netid);
				players = [...new Set(completedPlayers)]; // Remove duplicates
			}
		} catch (err) {
			console.error('Unexpected error loading players:', err);
			error = 'Failed to load players';
		}
	}

	async function loadPlayerData() {
		if (!selectedPlayer) return;

		isLoading = true;
		error = '';

		try {
			const { data, error: supabaseError } = await supabase
				.from('scores')
				.select('netid, data')
				.eq('netid', selectedPlayer)
				.limit(1);

			if (supabaseError) {
				console.error('Error loading player data:', supabaseError);
				error = 'Failed to load player data';
				return;
			}

			if (data && data.length > 0) {
				const rawData = data[0].data;
				playerData = {
					netid: data[0].netid,
					choices: rawData?.choices || [],
					payoffs: rawData?.payoffs || [],
					total_trials: rawData?.total_trials || 0,
					final_balance: rawData?.final_balance || 0,
					session_completed: rawData?.session_completed || false,
					timestamp: rawData?.timestamp || ''
				};

				generateChartData();
				// Use setTimeout to ensure DOM is ready
				setTimeout(() => {
					createCharts();
				}, 100);
			}
		} catch (err) {
			console.error('Unexpected error loading player data:', err);
			error = 'Failed to load player data';
		} finally {
			isLoading = false;
		}
	}

	function generateChartData() {
		if (!playerData) return;

		// Generate balance history (starting at 200, adding net gains)
		balanceHistory = [200];
		let currentBalance = 200;

		for (let i = 0; i < playerData.payoffs.length; i++) {
			const payout = playerData.payoffs[i];
			const machineId = playerData.choices[i];

			// Get machine cost (simplified lookup)
			const machineCosts = { 1: 20, 2: 18, 3: 15, 4: 25, 5: 20, 6: 25 };
			const cost = machineCosts[machineId as keyof typeof machineCosts] || 10;

			currentBalance += (payout - cost);
			balanceHistory.push(currentBalance);
		}

		// Count machine usage
		machineUsage = {};
		for (const choice of playerData.choices) {
			machineUsage[choice] = (machineUsage[choice] || 0) + 1;
		}

		// Generate payoff histogram
		const payoffRanges = [
			{ min: 0, max: 5, range: '$0-5' },
			{ min: 5, max: 10, range: '$5-10' },
			{ min: 10, max: 20, range: '$10-20' },
			{ min: 20, max: 50, range: '$20-50' },
			{ min: 50, max: 100, range: '$50-100' },
			{ min: 100, max: Infinity, range: '$100+' }
		];

		payoffHistogram = payoffRanges.map(range => ({
			range: range.range,
			count: playerData!.payoffs.filter(p => p >= range.min && p < range.max).length
		}));
	}

	function getMachineLabel(id: number): string {
		return id.toString();
	}

	function formatTimestamp(timestamp: string): string {
		if (!timestamp) return 'Unknown';
		try {
			return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
		} catch {
			return 'Invalid date';
		}
	}

	function createCharts() {
		if (!playerData) return;

		// Destroy existing charts
		if (balanceChart) {
			balanceChart.destroy();
			balanceChart = null;
		}
		if (machineChart) {
			machineChart.destroy();
			machineChart = null;
		}
		if (payoffChart) {
			payoffChart.destroy();
			payoffChart = null;
		}

		// Create balance chart
		const balanceCtx = document.getElementById('balanceChart') as HTMLCanvasElement;
		if (balanceCtx) {
			balanceChart = new Chart(balanceCtx, {
				type: 'line',
				data: {
					labels: balanceHistory.map((_, index) => index === 0 ? 'Start' : `Trial ${index}`),
					datasets: [{
						label: 'Balance',
						data: balanceHistory,
						borderColor: '#3b82f6',
						backgroundColor: 'rgba(59, 130, 246, 0.1)',
						borderWidth: 2,
						fill: true
					}]
				},
				options: {
					responsive: true,
					interaction: {
						intersect: false,
						mode: 'index'
					},
					plugins: {
						legend: {
							labels: { color: '#fff' }
						},
						tooltip: {
							callbacks: {
								title: function(context) {
									const index = context[0].dataIndex;
									return index === 0 ? 'Starting Balance' : `Trial ${index}`;
								},
								label: function(context) {
									const index = context.dataIndex;
									const balance = context.parsed.y;

									if (index === 0) {
										return `Balance: $${balance.toFixed(2)}`;
									}

									const machineUsed = playerData.choices[index - 1];
									const payout = playerData.payoffs[index - 1];
									const machineCosts = { 1: 20, 2: 18, 3: 15, 4: 25, 5: 20, 6: 25 };
									const cost = machineCosts[machineUsed as keyof typeof machineCosts] || 10;
									const netGain = payout - cost;

									return [
										`Balance: $${balance.toFixed(2)}`,
										`Machine Used: ${machineUsed}`,
										`Payout: $${payout.toFixed(2)}`,
										`Cost: $${cost.toFixed(2)}`,
										`Net: ${netGain >= 0 ? '+' : ''}$${netGain.toFixed(2)}`
									];
								}
							},
							titleColor: '#fff',
							bodyColor: '#fff',
							backgroundColor: 'rgba(0, 0, 0, 0.8)',
							borderColor: '#3b82f6',
							borderWidth: 1
						}
					},
					scales: {
						x: {
							ticks: { color: '#9ca3af' },
							grid: { color: 'rgba(156, 163, 175, 0.1)' }
						},
						y: {
							ticks: { color: '#9ca3af' },
							grid: { color: 'rgba(156, 163, 175, 0.1)' }
						}
					}
				}
			});
		}

		// Create machine usage chart
		const machineCtx = document.getElementById('machineChart') as HTMLCanvasElement;
		if (machineCtx) {
			const machineLabels = Object.keys(machineUsage).map(id => `Machine ${id}`);
			const machineCounts = Object.values(machineUsage);

			machineChart = new Chart(machineCtx, {
				type: 'bar',
				data: {
					labels: machineLabels,
					datasets: [{
						label: 'Usage Count',
						data: machineCounts,
						backgroundColor: [
							'rgba(239, 68, 68, 0.7)',
							'rgba(34, 197, 94, 0.7)',
							'rgba(249, 115, 22, 0.7)',
							'rgba(99, 102, 241, 0.7)',
							'rgba(168, 85, 247, 0.7)',
							'rgba(6, 182, 212, 0.7)'
						],
						borderColor: [
							'rgb(239, 68, 68)',
							'rgb(34, 197, 94)',
							'rgb(249, 115, 22)',
							'rgb(99, 102, 241)',
							'rgb(168, 85, 247)',
							'rgb(6, 182, 212)'
						],
						borderWidth: 1
					}]
				},
				options: {
					responsive: true,
					plugins: {
						legend: {
							labels: { color: '#fff' }
						}
					},
					scales: {
						x: {
							ticks: { color: '#9ca3af' },
							grid: { color: 'rgba(156, 163, 175, 0.1)' }
						},
						y: {
							ticks: { color: '#9ca3af' },
							grid: { color: 'rgba(156, 163, 175, 0.1)' }
						}
					}
				}
			});
		}

		// Create payoff distribution chart
		const payoffCtx = document.getElementById('payoffChart') as HTMLCanvasElement;
		if (payoffCtx) {
			payoffChart = new Chart(payoffCtx, {
				type: 'bar',
				data: {
					labels: payoffHistogram.map(bucket => bucket.range),
					datasets: [{
						label: 'Frequency',
						data: payoffHistogram.map(bucket => bucket.count),
						backgroundColor: 'rgba(147, 51, 234, 0.7)',
						borderColor: 'rgb(147, 51, 234)',
						borderWidth: 1
					}]
				},
				options: {
					responsive: true,
					plugins: {
						legend: {
							labels: { color: '#fff' }
						}
					},
					scales: {
						x: {
							ticks: { color: '#9ca3af' },
							grid: { color: 'rgba(156, 163, 175, 0.1)' }
						},
						y: {
							ticks: { color: '#9ca3af' },
							grid: { color: 'rgba(156, 163, 175, 0.1)' }
						}
					}
				}
			});
		}
	}
</script>

<div class="min-h-screen bg-gray-900 py-8">
	<div class="container mx-auto px-4">
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-white mb-2">Player Statistics</h1>
			<p class="text-gray-300">Detailed analysis of individual player performance</p>
		</div>

		<!-- Player Selection -->
		<div class="max-w-md mx-auto mb-8">
			<div class="bg-gray-800 rounded-lg p-6">
				<label for="player-select" class="block text-white font-medium mb-3">Select Player:</label>
				<select
					id="player-select"
					bind:value={selectedPlayer}
					on:change={loadPlayerData}
					class="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">Choose a player...</option>
					{#each players as player}
						<option value={player}>{player}</option>
					{/each}
				</select>
			</div>
		</div>

		{#if error}
			<div class="max-w-2xl mx-auto mb-6">
				<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
					{error}
				</div>
			</div>
		{/if}

		{#if isLoading}
			<div class="text-center">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
				<p class="text-gray-300 mt-4">Loading player data...</p>
			</div>
		{:else if playerData}
			<!-- Player Overview -->
			<div class="max-w-6xl mx-auto mb-8">
				<div class="bg-gray-800 rounded-lg p-6 mb-8">
					<h2 class="text-2xl font-bold text-white mb-4">Overview for {playerData.netid}</h2>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div class="text-center">
							<div class="text-3xl font-bold text-blue-400">{playerData.total_trials}</div>
							<div class="text-gray-400">Total Trials</div>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-green-400">${playerData.final_balance.toFixed(2)}</div>
							<div class="text-gray-400">Final Balance</div>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold {(playerData.final_balance - 200) >= 0 ? 'text-green-400' : 'text-red-400'}">
								{(playerData.final_balance - 200) >= 0 ? '+' : ''}${(playerData.final_balance - 200).toFixed(2)}
							</div>
							<div class="text-gray-400">Net Profit/Loss</div>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-purple-400">{formatTimestamp(playerData.timestamp).split(' ')[0]}</div>
							<div class="text-gray-400">Session Date</div>
						</div>
					</div>
				</div>

				<!-- Charts Grid -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<!-- Balance Over Time -->
					<div class="bg-gray-800 rounded-lg p-6">
						<h3 class="text-xl font-bold text-white mb-4">Balance Over Time</h3>
						<div class="h-64 bg-gray-700 rounded p-4">
							<canvas id="balanceChart"></canvas>
						</div>
					</div>

					<!-- Machine Usage -->
					<div class="bg-gray-800 rounded-lg p-6">
						<h3 class="text-xl font-bold text-white mb-4">Machine Usage</h3>
						<div class="h-64 bg-gray-700 rounded p-4">
							<canvas id="machineChart"></canvas>
						</div>
					</div>

					<!-- Payoff Distribution -->
					<div class="bg-gray-800 rounded-lg p-6">
						<h3 class="text-xl font-bold text-white mb-4">Payoff Distribution</h3>
						<div class="h-64 bg-gray-700 rounded p-4">
							<canvas id="payoffChart"></canvas>
						</div>
					</div>

					<!-- Session Details -->
					<div class="bg-gray-800 rounded-lg p-6">
						<h3 class="text-xl font-bold text-white mb-4">Session Details</h3>
						<div class="space-y-3">
							<div class="flex justify-between">
								<span class="text-gray-400">Session Completed:</span>
								<span class="text-white">{playerData.session_completed ? 'Yes' : 'No'}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-400">Completion Date:</span>
								<span class="text-white">{formatTimestamp(playerData.timestamp)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-400">Average Payoff:</span>
								<span class="text-white">
									${playerData.payoffs.length > 0 ? (playerData.payoffs.reduce((a, b) => a + b, 0) / playerData.payoffs.length).toFixed(2) : '0.00'}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-400">Most Used Machine:</span>
								<span class="text-white">
									{#if Object.keys(machineUsage).length > 0}
										Machine {getMachineLabel(parseInt(Object.entries(machineUsage).sort(([,a], [,b]) => b - a)[0][0]))}
										({Object.entries(machineUsage).sort(([,a], [,b]) => b - a)[0][1]} times)
									{:else}
										None
									{/if}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if selectedPlayer}
			<div class="text-center text-gray-400">
				<p>No data found for selected player.</p>
			</div>
		{:else}
			<div class="text-center text-gray-400">
				<p>Select a player to view their statistics.</p>
			</div>
		{/if}
	</div>
</div>