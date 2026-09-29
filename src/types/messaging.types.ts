
import type { IUserParticipant } from './user.types';

export type { IUserParticipant } from './user.types';

/** Utilisateur tel qu'affiché dans le fil (participant ou expéditeur). */
export type User = IUserParticipant;

export interface MessageSender {
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface Message {
  _id: string;
  /** Le back renvoie le champ Mongoose `conversation`, pas `conversationId`. */
  conversation: string;
  sender: MessageSender;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'audio' | 'system_notification' | 'offer' | 'counter_offer' | 'shipping_update' | 'mixed';
  /** Noms de fichiers stockés, pas des objets : `attachments: [String]` côté back. */
  attachments?: string[];
  isEncrypted: boolean;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  /** Identifiants des utilisateurs ayant lu — toujours présent, `[]` par défaut. */
  readBy: string[];
  createdAt: string;
  updatedAt?: string;
  preview?: string;
}

/** Modes de livraison d'une annonce (renvoyés avec le détail d'une conversation). */
export interface ProductShippingOptions {
  worldwide?: boolean;
  nationalOnly?: boolean;
  localPickup?: boolean;
  nationalCost?: number | null;
  worldwideCost?: number | null;
  shippingCost?: number | null;
}

export interface ProductReference {
  _id: string;
  shippingOptions?: ProductShippingOptions;
  title: string;
  description?: string;
  price?: number;
  currency?: 'EUR' | 'USD' | 'KRW' | 'JPY' | 'GBP';
  condition?: 'new' | 'likeNew' | 'good' | 'fair' | 'poor';
  /** Toujours sélectionné par le back : une annonce a au moins une image. */
  images: string[];
  category?: string;
  kpopGroup?: string;
  kpopMember?: string;
  allowOffers?: boolean;
  minOfferPercentage?: number;
  /** Prix libre : la fourchette remplace allowOffers / minOfferPercentage. */
  isPayWhatYouWant?: boolean;
  pwywMinPrice?: number | null;
  pwywMaxPrice?: number | null;
}

export interface NegotiationStatus {
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed';
  initialPrice: number;
  currentOffer: number;
  counterOffer?: number;
  expiresAt?: string;
}

export interface Conversation {
  _id: string;
  participants: IUserParticipant[];
  productId?: ProductReference | null;
  isActive: boolean;
  type: 'general' | 'product_inquiry' | 'negotiation';
  status: 'open' | 'closed' | 'archived' | 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed';
  createdBy: string;
  negotiation?: NegotiationStatus;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  lastMessage?: Message;
  title?: string;
  unreadCount?: number;
  otherParticipant?: IUserParticipant;
  /** Ajouté par le back : l'appelant est-il le vendeur du produit concerné. */
  isOwner?: boolean;
}

/** Pagination renvoyée par le module messagerie du back (toujours présente). */
export interface MessagingPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ConversationListResponse {
  success: boolean;
  message?: string;
  conversations: Conversation[];
  pagination: MessagingPagination;
}

/** Pièce jointe d'une conversation, telle que listée avec son détail. */
export interface ConversationMedia {
  filename: string;
  originalName: string;
  url: string;
  type: 'image' | 'document' | 'other';
  extension: string;
  uploadedAt: string;
  messageId: string;
}

export interface ConversationDetailResponse {
  success: boolean;
  message?: string;
  conversation: Conversation;
  messages: Message[];
  media?: ConversationMedia[];
  pagination: MessagingPagination;
}

export interface SendMessageRequest {
  content: string;
  contentType?: 'text' | 'image' | 'file' | 'audio';
  attachments?: File[];
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: Message;
}

export interface NegotiationRequest {
  productId: string;
  initialOffer: number;
  message?: string
}

export interface NegotiationResponse {
  success: boolean;
  message: string;
  conversation: Conversation;
  negotiation: NegotiationStatus;
}
export interface CancelOfferResponse {
  message: string
  conversationId: string
  cancelledOffer: {
    amount: number,
    cancelledAt: string
  }
}

export interface NegotiationActionRequest {
  action: 'accept' | 'reject' | 'counter';
  counterOffer?: number;
  message?: string;
}

export interface NegotiationActionResponse {
  success: boolean;
  message: string;
  negotiation: NegotiationStatus;
  conversation: Conversation;
}

/**
 * POST /api/messaging/pwyw : réglage du prix libre d'une annonce par son vendeur.
 * Sans maximum, seul le plancher s'applique.
 */
export interface PayWhatYouWantRequest {
  productId: string;
  minimumPrice: number;
  maximumPrice?: number | null;
}

/** Réglage du prix libre tel que renvoyé par l'API (activation ou désactivation). */
export interface PayWhatYouWantSettings {
  productId: string;
  enabled: boolean;
  minimumPrice: number | null;
  maximumPrice: number | null;
}

export interface PayWhatYouWantResponse {
  message: string;
  payWhatYouWant: PayWhatYouWantSettings;
}

export interface PayWhatYouWantOfferRequest {
  proposedPrice: number;
  message?: string;
}

/** Une proposition de prix libre suit le circuit d'une offre de négociation. */
export interface PayWhatYouWantOfferResponse {
  message: string;
  result: {
    conversation: Conversation;
    initialOffer: number;
    isUpdate: boolean;
    previousOffer: number | null;
  };
}

export interface StartConversationRequest {
  recipientId: string;
  productId?: string;
  initialMessage?: string;
  type?: 'general' | 'product_inquiry';
}

export interface StartConversationResponse {
  success: boolean;
  message: string;
  conversation: Conversation;
}

// Types pour les paramètres de requête
export interface ConversationListParams {
  page?: number;
  limit?: number;
  filter?: 'all' | 'unread' | 'active';
}

export interface ConversationDetailParams {
  page?: number;
  limit?: number;
}
