<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	function playAgain() {
		goto(base || '/');
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
				<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Success!
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Your score has been submitted successfully.
			</p>
		</div>

		<div>
			<button
				type="button"
				on:click={playAgain}
				class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
			>
				Play Again
			</button>
		</div>
	</div>
</div>