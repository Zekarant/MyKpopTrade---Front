import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/config/api';

const PUSH_API = `${API_URL}/api/notifications/push`;

function authHeaders(): Record<string, string> {
  const token = Cookies.get('sessionToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Convertit la clé VAPID base64-url en Uint8Array — format requis par
 * `pushManager.subscribe`. Le navigateur ne fait pas la conversion seul.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

export const pushService = {
  /** Vrai si le navigateur supporte Service Worker + Push. */
  isSupported(): boolean {
    return typeof window !== 'undefined'
      && 'serviceWorker' in navigator
      && 'PushManager' in window
      && 'Notification' in window;
  },

  /**
   * Enregistre le service worker une fois. Idempotent.
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    try {
      return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (error) {
      console.warn('Service worker registration failed', error);
      return null;
    }
  },

  /**
   * Demande la permission, souscrit aux push et envoie la subscription au
   * back. À appeler depuis un geste utilisateur (clic sur un bouton),
   * sinon les navigateurs récents bloquent la prompt.
   */
  async subscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;

    const registration = await this.registerServiceWorker();
    if (!registration) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const { data } = await axios.get<{ publicKey: string }>(`${PUSH_API}/vapid-public-key`);
    if (!data?.publicKey) return false;

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey)
    });

    await axios.post(`${PUSH_API}/subscribe`, { subscription: sub.toJSON() }, {
      headers: authHeaders()
    });
    return true;
  },

  /** Désinscrit l'utilisateur de tous les push sur ce navigateur. */
  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;
    const sub = await registration.pushManager.getSubscription();
    if (!sub) return;

    await axios.post(`${PUSH_API}/unsubscribe`, { endpoint: sub.endpoint }, {
      headers: authHeaders()
    }).catch(() => { /* tolérant : on désabonne quand même côté navigateur */ });
    await sub.unsubscribe();
  }
};

export default pushService;
