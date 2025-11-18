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

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Enter Your NetID
			</h2>
		</div>
		<form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
			<div>
				<label for="netid" class="sr-only">NetID</label>
				<input
					id="netid"
					name="netid"
					type="text"
					required
					bind:value={netid}
					class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
					placeholder="Enter your NetID"
				/>
			</div>
			<div>
				<button
					type="submit"
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Continue to Game
				</button>
			</div>
		</form>
	</div>
</div>
