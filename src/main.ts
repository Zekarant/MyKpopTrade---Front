import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'material-design-icons-iconfont/dist/material-design-icons.css';

import App from './App.vue'
import router from './router'
import Grid from './components/grid.vue';
import Card from './components/card.vue';

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.component("Grid", Grid);
app.component("Card", Card);

app.mount('#app')
