<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	let netid = '';

	function handleSubmit() {
		if (netid.trim()) {
			goto(`${base}/game?netid=${encodeURIComponent(netid)}`);
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-900">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-white mb-2">Multi-Armed Bandit</h1>
			<h2 class="text-2xl font-semibold text-gray-300 mb-8">
				Experiment
			</h2>
			<p class="text-gray-400 mb-8">
				You'll be playing 50 rounds with different slot machines. Each machine has unknown payout rates that you'll need to learn through experience.
			</p>
		</div>

		<div class="bg-gray-800 rounded-lg p-8 shadow-xl">
			<h3 class="text-xl font-semibold text-white mb-6 text-center">
				Enter Your NetID to Begin
			</h3>
			<form class="space-y-6" on:submit|preventDefault={handleSubmit}>
				<div>
					<label for="netid" class="block text-sm font-medium text-gray-300 mb-2">NetID</label>
					<input
						id="netid"
						name="netid"
						type="text"
						required
						bind:value={netid}
						class="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
						placeholder="Enter your NetID"
					/>
				</div>
				<button
					type="submit"
					class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Start Experiment
				</button>
			</form>
		</div>
	</div>
</div>
