<script lang="ts">
	export let mean: number;
	export let variance: number;
	export let machineId: number;
	export let machineLabel: string = machineId.toString();
	export let betAmount: number = 10;
	export let onPull: (result: BanditResult) => void;
	export let disabled: boolean = false;

	interface BanditResult {
		machineId: number;
		mean: number;
		variance: number;
		betAmount: number;
		payout: number;
		netGain: number;
		timestamp: Date;
	}

	let isPulling = false;
	let lastResult: BanditResult | null = null;

	// Box-Muller transformation for Gaussian random numbers
	function gaussianRandom(mean: number, variance: number): number {
		const u = Math.random();
		const v = Math.random();
		const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
		return mean + z * Math.sqrt(variance);
	}

	async function pullArm() {
		if (isPulling || disabled) return;

		isPulling = true;

		// Add some visual delay for the pulling animation
		await new Promise(resolve => setTimeout(resolve, 800));

		// Sample from Gaussian distribution
		const payout = gaussianRandom(mean, variance);
		const netGain = payout - betAmount;

		const result: BanditResult = {
			machineId,
			mean,
			variance,
			betAmount,
			payout: Math.round(payout * 100) / 100, // Round to cents
			netGain: Math.round(netGain * 100) / 100,
			timestamp: new Date()
		};

		lastResult = result;
		onPull(result);
		isPulling = false;
	}
</script>

<div class="bandit-arm">
	<div class="machine-body">
		<div class="machine-header">
			<h3 class="machine-title">Machine {machineLabel}</h3>
		</div>

		<div class="display-screen">
			{#if isPulling}
				<div class="pulling-animation">
					<div class="spinner"></div>
					<p>Pulling...</p>
				</div>
			{:else if lastResult}
				<div class="result-display">
					<div class="payout">Payout: ${lastResult.payout.toFixed(2)}</div>
					<div class="net-gain" class:positive={lastResult.netGain >= 0} class:negative={lastResult.netGain < 0}>
						Net: {lastResult.netGain >= 0 ? '+' : ''}${lastResult.netGain.toFixed(2)}
					</div>
				</div>
			{:else}
				<div class="ready-state">
					<p>Ready to pull</p>
					<p class="bet-amount">Cost: ${betAmount.toFixed(2)}</p>
				</div>
			{/if}
		</div>

		<button
			class="pull-button"
			on:click={pullArm}
			disabled={isPulling || disabled}
		>
			{disabled ? 'Session Complete' : isPulling ? 'Pulling...' : 'Pull Arm'}
		</button>
	</div>
</div>

<style>
	.bandit-arm {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		background: linear-gradient(145deg, #2c3e50, #3498db);
		border-radius: 12px;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
		min-width: 280px;
		max-width: 320px;
	}

	.machine-body {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.machine-header {
		text-align: center;
	}

	.machine-title {
		color: white;
		font-size: 1.25rem;
		font-weight: bold;
		margin: 0;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.display-screen {
		background: #1a1a1a;
		border: 3px solid #444;
		border-radius: 8px;
		padding: 1.5rem;
		min-height: 100px;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
	}

	.pulling-animation {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: #00ff00;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid #333;
		border-top: 2px solid #00ff00;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.result-display {
		text-align: center;
		color: white;
	}

	.payout {
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
		color: #ffd700;
	}

	.net-gain {
		font-size: 1.3rem;
		font-weight: bold;
	}

	.net-gain.positive {
		color: #00ff00;
	}

	.net-gain.negative {
		color: #ff4444;
	}

	.ready-state {
		text-align: center;
		color: #ccc;
	}

	.bet-amount {
		color: #ffd700;
		font-weight: bold;
		margin-top: 0.5rem;
	}

	.pull-button {
		background: linear-gradient(145deg, #e74c3c, #c0392b);
		border: none;
		color: white;
		font-size: 1.2rem;
		font-weight: bold;
		padding: 0.75rem 2rem;
		border-radius: 8px;
		cursor: pointer;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.pull-button:hover:not(:disabled) {
		background: linear-gradient(145deg, #c0392b, #a93226);
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
	}

	.pull-button:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.pull-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.pulling-animation p, .ready-state p {
		margin: 0;
	}
</style>