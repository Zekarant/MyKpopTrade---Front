import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './css/main.css'
import './css/responsive/phone.css'
import './css/responsive/tablette.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'bootstrap-icons/font/bootstrap-icons.css';
import { func } from "./function";

import App from './App.vue'
import router from './router'
import Grid from './components/grid.vue';
import post from './components/post.vue';
import card_illu from './components/card_illu.vue';
import nav_bar from './components/adherents/nav_bar.vue';
import banner from './components/adherents/banner.vue';
import segment_profil from './components/adherents/segment_profil.vue';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.config.globalProperties.$func = func;

app.component("post", post);
app.component("Grid", Grid);
app.component("card_illu", card_illu);
app.component("nav_bar", nav_bar);
app.component("banner", banner);
app.component("segment_profil", segment_profil);

app.mount('#app')
