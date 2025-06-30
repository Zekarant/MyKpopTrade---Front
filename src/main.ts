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
import search_bar from './components/search_bar.vue';
import row_products from './components/row_products.vue';
import review_card from './components/review_card.vue';
import ImageCarousel from './components/ImageCarousel.vue';
import filter_review from './components/filter_review.vue';
import response_review from './components/response_review.vue';
import card from './components/card.vue';
import Vue3Lottie from 'vue3-lottie'
import Aura from '@primeuix/themes/aura';
import Slider from 'primevue/slider';
import PrimeVue from 'primevue/config';

const app = createApp(App)

app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.config.globalProperties.$func = func;
app.use(Vue3Lottie);
app.component("post", post);
app.component("Grid", Grid);
app.component("card_illu", card_illu);
app.component("nav_bar", nav_bar);
app.component("banner", banner);
app.component("segment_profil", segment_profil);
app.component("search_bar", search_bar);
app.component("row_products", row_products);
app.component("review_card", review_card);
app.component("ImageCarousel", ImageCarousel);
app.component("filter_review", filter_review);
app.component("card", card);
app.component("response_review", response_review);
app.component("Slider", Slider);
app.mount('#app')
