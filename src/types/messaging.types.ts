
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

export interface ProductReference {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: 'EUR' | 'USD' | 'KRW' | 'JPY' | 'GBP';
  condition?: 'new' | 'likeNew' | 'good' | 'fair' | 'poor';
  images?: string[];
  category?: string;
  kpopGroup?: string;
  kpopMember?: string;
}

export interface NegotiationStatus {
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed';
  initialPrice: number;
  currentOffer: number;
  counterOffer?: number;
  expiresAt?: string;
}

export interface PayWhatYouWantStatus {
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  minimumPrice: number;
  maximumPrice?: number;
  proposedPrice?: number;
  proposedBy?: string;
  proposedAt?: string;
  acceptedPrice?: number;
  acceptedAt?: string;
  expiresAt?: string;
}

export interface Conversation {
  _id: string;
  participants: IUserParticipant[];
  productId?: ProductReference | null;
  isActive: boolean;
  type: 'general' | 'product_inquiry' | 'negotiation' | 'pay_what_you_want';
  status: 'open' | 'closed' | 'archived' | 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed';
  createdBy: string;
  negotiation?: NegotiationStatus;
  payWhatYouWant?: PayWhatYouWantStatus;
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

export interface ConversationDetailResponse {
  success: boolean;
  message?: string;
  conversation: Conversation;
  messages: Message[];
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
}

export interface PayWhatYouWantRequest {
  productId: string;
  minimumPrice: number;
  maximumPrice?: number;
  message?: string;
}

export interface PayWhatYouWantResponse {
  success: boolean;
  message: string;
  conversation: Conversation;
  payWhatYouWant: PayWhatYouWantStatus;
}

export interface PayWhatYouWantOfferRequest {
  proposedPrice: number;
  message?: string;
}

export interface PayWhatYouWantOfferResponse {
  success: boolean;
  message: string;
  payWhatYouWant: PayWhatYouWantStatus;
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
