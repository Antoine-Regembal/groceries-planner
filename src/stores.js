import { writable } from 'svelte/store';

export const groceriesLists = writable([
  {
    title: 'My first groceries list',
    content: [
      {
        label: 'Baguette',
        quantity: 2,
      },
      {
        label: 'Liquid Soap',
        quantity: 1,
      },
    ],
  },
  {
    title: 'My second groceries list',
    content: [
      {
        label: 'Vanilla ice cream',
        quantity: 1,
      },
      {
        label: 'Toothpaste',
        quantity: 1,
      },
    ],
  },
]);

export const selectedGroceriesList = writable({});
