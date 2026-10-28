import { defineStore } from 'pinia';
import notificationService, { type Notification } from '@/services/notification.service';

/** Plus que la page chargée par fetch() : la liste déroulante n'en montre pas davantage. */
const MAX_NOTIFICATIONS_KEPT = 50;

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    notifications: [],
    unreadCount: 0
  }),

  actions: {
    async fetch() {
      try {
        const data = await notificationService.getNotifications();
        // Le total de non-lues vient de l'API : la liste reçue n'est qu'une page.
        this.unreadCount = data.pagination?.unreadCount || 0;
        this.notifications = data.notifications || [];
      } catch {
        // Notifications indisponibles : la page reste utilisable sans elles.
      }
    },

    /** Marque lue localement tout de suite ; l'appel réseau part sans être attendu. */
    markRead(id: string) {
      const notification = this.notifications.find((n) => n._id === id);
      if (!notification || notification.isRead) return;
      notification.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      notificationService.markAsRead(id).catch(() => {});
    },

    async markAllRead() {
      try {
        await notificationService.markAllAsRead();
        this.notifications.forEach((n) => { n.isRead = true; });
        this.unreadCount = 0;
      } catch {
        // Échec réseau : rien n'a changé côté API, l'affichage non plus.
      }
    },

    /**
     * Supprime une notification. Retrait local seulement après l'accord de
     * l'API : sinon elle réapparaîtrait au prochain chargement.
     */
    async remove(id: string) {
      try {
        await notificationService.deleteNotification(id);
      } catch {
        return;
      }
      const removed = this.notifications.find((n) => n._id === id);
      this.notifications = this.notifications.filter((n) => n._id !== id);
      if (removed && !removed.isRead) this.unreadCount = Math.max(0, this.unreadCount - 1);
    },

    /** Notification poussée par le flux temps réel (SSE). */
    handleNewNotification(notification: Notification) {
      // Déjà là (rechargement de la liste juste avant l'événement) : ne pas compter deux fois.
      if (this.notifications.some((n) => n._id === notification._id)) return;
      // Liste bornée : un onglet ouvert des heures ne doit pas l'allonger sans fin.
      this.notifications = [notification, ...this.notifications].slice(0, MAX_NOTIFICATIONS_KEPT);
      if (!notification.isRead) this.unreadCount += 1;
    },

    /** Total calculé par l'API (resynchronisation à chaque ouverture du flux). */
    applyUnreadCount(total: number) {
      this.unreadCount = total;
    },

    reset() {
      this.notifications = [];
      this.unreadCount = 0;
    }
  }
});
