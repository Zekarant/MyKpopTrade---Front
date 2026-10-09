import { defineStore } from 'pinia';
import notificationService, { type Notification } from '@/services/notification.service';

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

    reset() {
      this.notifications = [];
      this.unreadCount = 0;
    }
  }
});
