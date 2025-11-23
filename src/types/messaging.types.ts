
import type { IUserParticipant } from './user.types';

export type { IUserParticipant } from './user.types';

export interface MessageSender {
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface MessageAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'audio' | 'system_notification' | 'offer' | 'counter_offer' | 'shipping_update' | 'mixed';
  attachments?: MessageAttachment[];
  isEncrypted: boolean;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  readBy?: Array<{
    userId: string;
    readAt: string;
  }>;
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
  status: 'pending' | 'accepted' | 'rejected' | 'counter' | 'expired';
  originalPrice?: number;
  proposedPrice?: number;
  counterOffers?: Array<{
    price: number;
    proposedBy: string;
    proposedAt: string;
    message?: string;
  }>;
  acceptedPrice?: number;
  acceptedAt?: string;
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
}

export interface ConversationListResponse {
  success: boolean;
  message?: string;
  conversations: Conversation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ConversationDetailResponse {
  success: boolean;
  message?: string;
  conversation: Conversation;
  messages: Message[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
