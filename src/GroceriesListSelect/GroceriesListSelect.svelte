<script>
    import {groceriesLists, selectedGroceriesList} from "../stores.js"

    let groceries_lists;
	groceriesLists.subscribe(value => {
		groceries_lists = value;
    });

    let selected_groceries_list = selectedGroceriesList;
    selectedGroceriesList.subscribe(value => {
		selected_groceries_list = value;
    });
    selectedGroceriesList.set(groceries_lists[0])
    
    const updateSelectedGroceriesList = selected => {
        selectedGroceriesList.update(() => selected)
    };

    let isGroceriesListCreateModaleDisplayed = false;
    let newGroceriesListName = "";
    let newGroceriesListContent = [];
    let newGroceriesListContentLabel = "";
    let newGroceriesListContentQuantity = 0;

    const addProduct = () => {
        newGroceriesListContent = [
            ...newGroceriesListContent,
            {
                "label": newGroceriesListContentLabel,
                "quantity": newGroceriesListContentQuantity
            }
        ];

        newGroceriesListContentLabel = "";
        newGroceriesListContentQuantity = 0;
    }

    const addList = () => {
        groceriesLists.update(() => [
            ...groceries_lists,
            {
                "title": newGroceriesListName,
                "content": newGroceriesListContent
            }
        ]);
        newGroceriesListName = "";
        newGroceriesListContent = [];
        newGroceriesListContentLabel = "";
        newGroceriesListContentQuantity = 0;
    }
</script>

<label>
    Select a groceries list
    <!-- svelte-ignore a11y-no-onchange -->
    <select bind:value={selected_groceries_list} on:change={updateSelectedGroceriesList(selected_groceries_list)}>
        {#each groceries_lists as list}
            <option value={list}>{list.title}</option>
        {/each}
    </select>
</label>
<button 
    on:click={() => isGroceriesListCreateModaleDisplayed = !isGroceriesListCreateModaleDisplayed}>
    Create new groceries list
</button>
{#if isGroceriesListCreateModaleDisplayed}
    <div>
        <input bind:value={newGroceriesListName} type="text" placeholder="List name"/>
        <br/>
        <input bind:value={newGroceriesListContentLabel} type="text" placeholder="Product"/>
        <input bind:value={newGroceriesListContentQuantity} type="number" placeholder="Quantity"/>
        <br/>
        <button on:click={addProduct}>Add product</button>
        <br/>
        <button on:click={addList}>Done</button>
        <br/>
        <ul>
            {#each newGroceriesListContent as newGroceriesListContent}
                <li>{newGroceriesListContent.label} x{newGroceriesListContent.quantity}</li>
            {/each}
        </ul>
    </div>
{/if}