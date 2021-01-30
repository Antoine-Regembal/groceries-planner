<script>
    import { selectedGroceriesList } from "../stores.js";
    
    let selected_groceries_list;
    selectedGroceriesList.subscribe(value => {
		selected_groceries_list = value;
    });
</script>

<h1>{selected_groceries_list.title}</h1>
<ul>
    {#each selected_groceries_list.content as content}
        <li>{content.label} x{content.quantity}</li>
    {/each}
</ul>