/**
 * Logique pure de la messagerie, extraite de MessagesView.vue pour être testée.
 * Aucune dépendance au DOM, aux cookies ou au store : l'identifiant de
 * l'utilisateur courant est toujours passé explicitement.
 */

type Id = string;
type Ref = Id | { _id?: Id; id?: Id; username?: string } | null | undefined;

export interface ConversationLike {
  _id?: Id;
  id?: Id;
  username?: string;
  unreadCount?: number;
  favoritedBy?: Id[];
  archivedBy?: Id[];
  participants?: Ref[];
  otherParticipant?: { _id?: Id; id?: Id; username?: string } | null;
  lastMessage?: { content?: string } | string | null;
  offerHistory?: Array<{ createdAt: string | Date; status?: string }>;
  negotiation?: { status?: string } | null;
  productContext?: TransactionContext | null;
  context?: TransactionContext | null;
}

export interface TransactionContext {
  type?: string;
  status?: string;
  isOwner?: boolean;
  negotiation?: { status?: string } | null;
}

export type ConversationTab = 'all' | 'favorites' | 'unread' | 'archived';

const refId = (ref: Ref): string => {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  return String(ref._id ?? ref.id ?? '');
};

export function isFavoriteConversation(conversation: ConversationLike, userId: Id | null | undefined): boolean {
  return Boolean(userId) && (conversation.favoritedBy ?? []).includes(userId as Id);
}

export function isArchivedConversation(conversation: ConversationLike, userId: Id | null | undefined): boolean {
  return Boolean(userId) && (conversation.archivedBy ?? []).includes(userId as Id);
}

/**
 * Interlocuteur : `otherParticipant` s'il est fourni par l'API, sinon le premier
 * participant qui n'est pas l'utilisateur courant, sinon le premier participant.
 */
export function getOtherParticipant(conversation: ConversationLike, userId: Id | null | undefined) {
  if (conversation.otherParticipant) return conversation.otherParticipant;

  const participants = conversation.participants ?? [];
  const other = participants.find((participant) => refId(participant) !== String(userId ?? ''));
  return other ?? participants[0] ?? null;
}

const lastMessageText = (conversation: ConversationLike): string => {
  const last = conversation.lastMessage;
  if (!last) return '';
  return typeof last === 'string' ? last : last.content ?? '';
};

/** Liste affichée pour un onglet et une recherche donnés. */
export function filterConversations(
  conversations: ConversationLike[],
  { tab, query, userId }: { tab: ConversationTab | string; query: string; userId: Id | null | undefined }
): ConversationLike[] {
  let result: ConversationLike[];
  switch (tab) {
    case 'favorites':
      result = conversations.filter((conv) => isFavoriteConversation(conv, userId));
      break;
    case 'unread':
      // L'ancienne version passait `conv.archivedBy` au lieu de la conversation :
      // les conversations archivées restaient dans l'onglet « non lus ».
      result = conversations.filter((conv) => (conv.unreadCount ?? 0) > 0 && !isArchivedConversation(conv, userId));
      break;
    case 'archived':
      result = conversations.filter((conv) => isArchivedConversation(conv, userId));
      break;
    default:
      result = conversations.filter((conv) => !isArchivedConversation(conv, userId));
  }

  const search = query.trim().toLowerCase();
  if (!search) return result;

  return result.filter((conv) => {
    const other = getOtherParticipant(conv, userId);
    const username = (typeof other === 'object' && other?.username) || conv.username || '';
    return username.toLowerCase().includes(search) || lastMessageText(conv).toLowerCase().includes(search);
  });
}

/** Compteurs des onglets, cohérents avec `filterConversations`. */
export function countConversationsByTab(conversations: ConversationLike[], userId: Id | null | undefined) {
  const notArchived = conversations.filter((conv) => !isArchivedConversation(conv, userId));
  return {
    all: notArchived.length,
    favorites: conversations.filter((conv) => isFavoriteConversation(conv, userId)).length,
    unread: notArchived.filter((conv) => (conv.unreadCount ?? 0) > 0).length,
    archived: conversations.length - notArchived.length
  };
}

export interface MessageLike {
  sender?: Ref;
  isOwn?: boolean;
  createdAt?: string | Date;
  readBy?: Id[];
  delivered?: boolean;
}

/** Tolère un `sender` absent (message système), qui faisait planter l'ancienne version. */
export function isOwnMessage(message: MessageLike, userId: Id | null | undefined): boolean {
  if (message.isOwn === true) return true;
  return Boolean(userId) && refId(message.sender) === userId;
}

/**
 * Statut de l'offre liée à un message : l'offre de l'historique créée à la
 * même seconde (les millisecondes diffèrent entre message et offre).
 */
export function findOfferStatus(conversation: ConversationLike | null | undefined, message: MessageLike): string | null {
  if (!conversation?.offerHistory || !message.createdAt) return null;
  const messageSecond = Math.floor(new Date(message.createdAt).getTime() / 1000);
  const offer = conversation.offerHistory.find(
    (item) => Math.floor(new Date(item.createdAt).getTime() / 1000) === messageSecond
  );
  return offer?.status ?? null;
}

/** Horodatage court de la liste : « maintenant », « 5m », « 14:32 » ou « 03/09 ». */
export function formatMessageTimestamp(timestamp: string | Date | null | undefined, now = new Date()): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();

  if (diff < 60_000) return 'maintenant';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export function formatLongDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const CONVERSATION_TYPE_LABELS: Record<string, string> = {
  negotiation: 'Négociation',
  exchange: 'Échange',
  sale: 'Vente',
  general: 'Général'
};

export const conversationTypeLabel = (type: string): string => CONVERSATION_TYPE_LABELS[type] ?? type;

export function messageStatusIcon(message: MessageLike): string {
  if ((message.readBy?.length ?? 0) > 1) return 'bi-check2-all text-primary';
  if (message.delivered) return 'bi-check2-all';
  return 'bi-check2';
}

// --- Encadré « transaction » de la barre latérale ---------------------------

const transactionContext = (conversation: ConversationLike | null | undefined) =>
  conversation?.productContext || conversation?.context || null;

export function transactionTitle(conversation: ConversationLike | null | undefined): string {
  const type = transactionContext(conversation)?.type;
  if (type === 'negotiation') return 'Négociation';
  if (type === 'exchange') return 'Échange';
  return 'Transaction';
}

export function transactionStatus(conversation: ConversationLike | null | undefined): string {
  return transactionContext(conversation)?.status?.toLowerCase() || 'pending';
}

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé'
};

/** Libellé du statut de la négociation (lu sur `context`, sinon la conversation). */
export function transactionStatusLabel(conversation: ConversationLike | null | undefined): string | undefined {
  const status = (conversation?.context || conversation)?.negotiation?.status;
  return status ? TRANSACTION_STATUS_LABELS[status] ?? status : status;
}
