import { ComponentCustomProperties } from "vue";
import { func } from "./function"; // Assure-toi que le chemin est correct

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $func: typeof func;
  }
}
