import { ComponentCustomProperties } from "vue";
import { func } from "./function"; // Assure-toi que le chemin est correct
import type { Router, RouteLocationNormalizedLoaded } from "vue-router";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $func: typeof func;
    // vue-router déclare $router/$route via `declare module 'vue'`, or `vue` ne
    // fait que ré-exporter `@vue/runtime-core` : l'augmentation crée une
    // interface distincte de celle dont hérite ComponentPublicInstance, et
    // `this.$router` reste introuvable dans les composants Options API.
    $router: Router;
    $route: RouteLocationNormalizedLoaded;
  }
}
