declare module '*.vue' {
    import { DefineComponent } from 'vue';
    const component: DefineComponent;
    export default component;
  }

// Feuille de style exportée sans extension `.css` : les déclarations de vite/client ne la couvrent pas.
declare module 'vue3-emoji-picker/css'
  