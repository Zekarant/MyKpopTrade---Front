import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Bootstrap avant la feuille maison : nos styles doivent gagner à spécificité
// égale.
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './css/main.scss'
import { func } from "./function"

import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import pushService from './services/push.service'
import { warnIfLegalIncomplete } from './config/legal'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
})
// Pas de composants globaux : chaque vue importe ceux qu'elle utilise, ce qui
// les garde hors du bundle initial.
app.config.globalProperties.$func = func
app.mount('#app')

// Enregistre le service worker au démarrage (PWA + push). On NE demande PAS
// la permission de notification ici : c'est fait à la demande, depuis un
// geste utilisateur (cf. pushService.subscribe).
pushService.registerServiceWorker().catch(() => { /* silently ignored */ })

warnIfLegalIncomplete()
