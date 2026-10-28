import { API_URL } from '@/config/api';
import { ensureAccessToken, refreshAccessToken } from '@/services/http';
import { createRealtimeClient, type RealtimeMessage } from '@/services/realtime';
import type { Notification } from '@/services/notification.service';
import type { Message } from '@/types/messaging.types';
import { useMessagingStore, type ReadReceipt } from '@/store/messaging.store';
import { useNotificationStore } from '@/store/notification.store';

/**
 * Branche le flux temps réel de l'API sur les stores. Les noms d'événements
 * sont ceux de REALTIME_EVENTS côté API (modules/realtime/services/realtimePublisher.ts).
 */
export function dispatchRealtimeEvent({ event, data }: RealtimeMessage): void {
  switch (event) {
    case 'message:new':
      useMessagingStore().handleNewMessage((data as { message: Message }).message);
      break;
    case 'conversation:read':
      useMessagingStore().handleConversationRead(data as ReadReceipt);
      break;
    case 'notification:new':
      useNotificationStore().handleNewNotification(data as Notification);
      break;
    case 'unread:update': {
      const counts = data as { messages: number; notifications: number };
      useMessagingStore().applyUnreadCount(counts.messages);
      useNotificationStore().applyUnreadCount(counts.notifications);
      break;
    }
    // Événement inconnu (API plus récente que ce front) : ignoré.
  }
}

const client = createRealtimeClient({
  url: `${API_URL}/api/realtime/stream`,
  getToken: ensureAccessToken,
  refreshToken: refreshAccessToken,
  onEvent: dispatchRealtimeEvent
});

/** Ouvre le flux si ce n'est pas déjà fait. À appeler une fois connecté. */
export function startRealtimeSync(): void {
  client.start();
}

/** Ferme le flux (déconnexion) : le compte suivant ne doit rien en recevoir. */
export function stopRealtimeSync(): void {
  client.stop();
}
