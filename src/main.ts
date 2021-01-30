import App from './App.svelte';
import config from './App.config.json';

const app = new App({
  target: document.body,
  props: {
    config,
  },
});

export default app;
