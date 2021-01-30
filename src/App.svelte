<script>
	export let config;
	import {selectedGroceriesList} from "./stores.js"
	import GroceriesListSelect from "./GroceriesListSelect";
	import GroceriesListDisplay from "./GroceriesListDisplay";
</script>

<div>
	<h1>{config.applicationName}</h1>
</div>


<main>
	<GroceriesListSelect  />
	<hr />
	<GroceriesListDisplay />
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 1em;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>