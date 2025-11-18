<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	function playAgain() {
		goto(base || '/');
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-900">
	<div class="max-w-lg w-full space-y-8">
		<div class="bg-gray-800 rounded-lg p-8 shadow-xl">
			<div class="text-center">
				<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-600 mb-6">
					<svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>

				<h2 class="text-3xl font-bold text-white mb-4">
					Experiment Complete!
				</h2>

				<p class="text-gray-300 text-lg mb-6">
					Thank you for participating in the multi-armed bandit experiment. Your data has been successfully recorded.
				</p>

				<div class="bg-gray-700 rounded-lg p-4 mb-6">
					<p class="text-gray-400 text-sm">
						Your session data including all machine choices and payoffs has been saved for research analysis.
					</p>
				</div>
			</div>

			<button
				type="button"
				on:click={playAgain}
				class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				Start New Session
			</button>
		</div>
	</div>
</div>