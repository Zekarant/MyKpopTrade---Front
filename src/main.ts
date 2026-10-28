import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Bootstrap avant la feuille maison : nos styles doivent gagner à spécificité
// égale.
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
// Plus Jakarta Sans auto-hébergée (police variable 200–800, WOFF2, font-display:
// swap) : la charger depuis fonts.googleapis.com transmettait l'IP du visiteur à
// Google avant tout consentement (RGPD). Seuls les sous-ensembles Unicode
// réellement affichés sont téléchargés (unicode-range), l'italique à la demande.
import '@fontsource-variable/plus-jakarta-sans/wght.css'
import '@fontsource-variable/plus-jakarta-sans/wght-italic.css'
import './css/main.scss'
import { func } from "./function"

import App from './App.vue'
import router from './router'
import pushService from './services/push.service'
import { warnIfLegalIncomplete } from './config/legal'
import { bindSessionEnd } from './store/sessionLifecycle'

const app = createApp(App)

app.use(createPinia())
app.use(router)
// Les services annoncent la fin de session sans connaître le routeur : c'est
// ici que l'application vide les stores du compte et renvoie vers /login.
bindSessionEnd(router)
// Pas de composants globaux : chaque vue importe ceux qu'elle utilise, ce qui
// les garde hors du bundle initial.
app.config.globalProperties.$func = func
app.mount('#app')

// Enregistre le service worker au démarrage (PWA + push). On NE demande PAS
// la permission de notification ici : c'est fait à la demande, depuis un
// geste utilisateur (cf. pushService.subscribe).
pushService.registerServiceWorker().catch(() => { /* silently ignored */ })

warnIfLegalIncomplete()
