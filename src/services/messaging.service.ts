import { API_URL } from '@/config/api';
import { apiClient } from '@/services/apiClient';
import { attachmentTokenParam } from '@/services/attachmentAccess';

import type {
  ConversationListResponse,
  ConversationDetailResponse,
  SendMessageRequest,
  SendMessageResponse,
  NegotiationRequest,
  NegotiationResponse,
  CancelOfferResponse,
  NegotiationActionRequest,
  NegotiationActionResponse,
  PayWhatYouWantRequest,
  PayWhatYouWantResponse,
  PayWhatYouWantOfferRequest,
  PayWhatYouWantOfferResponse,
  StartConversationRequest,
  StartConversationResponse,
  ConversationListParams,
  ConversationDetailParams
} from '@/types/messaging.types';
import type { UserResponse } from '@/types/user.types';

/**
 * Messagerie : conversations, messages, négociations et prix libre.
 *
 * Les erreurs réseau et API arrivent en `ApiError` (cf. apiClient) ; les
 * contrôles locaux ci-dessous lèvent une `Error` avant tout appel, pour ne pas
 * solliciter l'API avec une requête qu'elle refuserait.
 */

function requireId(value: string | undefined, message: string): void {
  if (!value?.trim()) {
    throw new Error(message);
  }
}

const CONVERSATION_ID_REQUIRED = 'ID de conversation requis';

class MessagingService {
  private client = apiClient('/api/messaging');
  private usersClient = apiClient('/api/users');

  async getUserConversations(params?: ConversationListParams): Promise<ConversationListResponse> {
    const { data } = await this.client.get<ConversationListResponse>('/', { params });
    return data;
  }

  /** Une conversation et une page de ses messages. */
  async getConversation(conversationId: string, params?: ConversationDetailParams): Promise<ConversationDetailResponse> {
    requireId(conversationId, CONVERSATION_ID_REQUIRED);
    const { data } = await this.client.get<ConversationDetailResponse>(`/${conversationId}`, { params });
    return data;
  }

  async startConversation(request: StartConversationRequest): Promise<StartConversationResponse> {
    requireId(request.recipientId, 'ID du destinataire requis');
    const { data } = await this.client.post<StartConversationResponse>('/', request);
    return data;
  }

  /** Envoi en multipart : le message peut porter des pièces jointes. */
  async sendMessage(conversationId: string, request: SendMessageRequest): Promise<SendMessageResponse> {
    requireId(conversationId, CONVERSATION_ID_REQUIRED);
    requireId(request.content, 'Contenu du message requis');

    const formData = new FormData();
    formData.append('content', request.content);
    formData.append('contentType', request.contentType || 'text');
    request.attachments?.forEach((file) => formData.append('attachments', file));

    const { data } = await this.client.post<SendMessageResponse>(`/${conversationId}/messages`, formData);
    return data;
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    requireId(conversationId, CONVERSATION_ID_REQUIRED);
    await this.client.put(`/${conversationId}/read`);
  }

  async deleteMessage(messageId: string): Promise<void> {
    requireId(messageId, 'ID de message requis');
    await this.client.delete(`/messages/${messageId}`);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    requireId(conversationId, CONVERSATION_ID_REQUIRED);
    await this.client.delete(`/${conversationId}`);
  }

  /** Bascule la conversation dans les favoris (ou l'en retire). */
  async favorite(conversationId: string): Promise<void> {
    requireId(conversationId, CONVERSATION_ID_REQUIRED);
    await this.client.put(`/${conversationId}/favorite`);
  }

  async archiveConversation(conversationId: string): Promise<void> {
    requireId(conversationId, CONVERSATION_ID_REQUIRED);
    await this.client.put(`/${conversationId}/archive`);
  }

  async unarchiveConversation(conversationId: string): Promise<void> {
    requireId(conversationId, CONVERSATION_ID_REQUIRED);
    await this.client.put(`/${conversationId}/unarchive`);
  }

  /**
   * URL d'une pièce jointe, pour `<img src>` : la route vérifie l'appartenance
   * à la conversation grâce au jeton de lecture placé dans l'URL.
   */
  getAttachmentUrl(messageId: string, attachmentName: string): string {
    if (!messageId.trim() || !attachmentName.trim()) {
      throw new Error('ID de message et nom de la pièce jointe requis');
    }

    return `${API_URL}/api/messaging/messages/${messageId}/attachments/${attachmentName}${attachmentTokenParam()}`;
  }

  async initiateNegotiation(request: NegotiationRequest): Promise<NegotiationResponse> {
    requireId(request.productId, 'ID du produit requis');
    if (typeof request.initialOffer !== 'number' || request.initialOffer <= 0) {
      throw new Error('Prix proposé invalide');
    }

    const { data } = await this.client.post<NegotiationResponse>('/negotiate', request);
    return data;
  }

  async cancelNegotiation(
    productId: string,
    initialOffer: number,
    conversationId: string,
    message?: string
  ): Promise<CancelOfferResponse> {
    const { data } = await this.client.delete<CancelOfferResponse>(`/${conversationId}/cancel-offer`, {
      data: { productId, initialOffer, message }
    });
    return data;
  }

  async respondToNegotiation(
    conversationId: string,
    request: NegotiationActionRequest
  ): Promise<NegotiationActionResponse> {
    requireId(conversationId, CONVERSATION_ID_REQUIRED);

    const validActions: NegotiationActionRequest['action'][] = ['accept', 'reject', 'counter'];
    if (!validActions.includes(request.action)) {
      throw new Error('Action invalide');
    }
    if (request.action === 'counter' && (typeof request.counterOffer !== 'number' || request.counterOffer <= 0)) {
      throw new Error('Contre-offre invalide');
    }

    const { data } = await this.client.post<NegotiationActionResponse>(`/${conversationId}/respond`, request);
    return data;
  }

  /** Active ou met à jour le prix libre d'une annonce (vendeur uniquement). */
  async initiatePayWhatYouWant(request: PayWhatYouWantRequest): Promise<PayWhatYouWantResponse> {
    requireId(request.productId, 'ID du produit requis');

    const { minimumPrice, maximumPrice } = request;
    if (typeof minimumPrice !== 'number' || !Number.isFinite(minimumPrice) || minimumPrice < 0) {
      throw new Error('Prix minimum invalide');
    }

    // Maximum facultatif : la clé n'est envoyée que s'il est renseigné.
    const payload: PayWhatYouWantRequest = { productId: request.productId, minimumPrice };
    if (maximumPrice !== undefined && maximumPrice !== null) {
      if (!Number.isFinite(maximumPrice) || maximumPrice <= minimumPrice) {
        throw new Error('Prix maximum invalide');
      }
      payload.maximumPrice = maximumPrice;
    }

    const { data } = await this.client.post<PayWhatYouWantResponse>('/pwyw', payload);
    return data;
  }

  /** Retire le prix libre d'une annonce (vendeur uniquement). */
  async disablePayWhatYouWant(productId: string): Promise<PayWhatYouWantResponse> {
    requireId(productId, 'ID du produit requis');
    const { data } = await this.client.post<PayWhatYouWantResponse>('/pwyw', { productId, enabled: false });
    return data;
  }

  /** Nouvelle proposition de prix libre depuis une conversation existante (même circuit qu'une offre). */
  async makePayWhatYouWantOffer(
    conversationId: string,
    request: PayWhatYouWantOfferRequest
  ): Promise<PayWhatYouWantOfferResponse> {
    requireId(conversationId, CONVERSATION_ID_REQUIRED);
    if (typeof request.proposedPrice !== 'number' || request.proposedPrice <= 0) {
      throw new Error('Prix proposé invalide');
    }

    const { data } = await this.client.post<PayWhatYouWantOfferResponse>(`/${conversationId}/pwyw-offer`, request);
    return data;
  }

  /** Recherche de membres par nom, pour démarrer une conversation. */
  async getUserByName(name: string): Promise<UserResponse> {
    // `params` encode la saisie : un « & » ou un « # » dans le nom ne casse plus la requête.
    const { data } = await this.usersClient.get<UserResponse>('/search', { params: { query: name } });
    return data;
  }

  async getConversationOffers(conversationId: string) {
    const { data } = await this.client.get(`/${conversationId}/offers`);
    return data;
  }

  async getConversationMedia(conversationId: string) {
    const { data } = await this.client.get(`/${conversationId}/media`);
    return data;
  }

  async markMessageAsRead(messageId: string) {
    const { data } = await this.client.put(`/messages/${messageId}/read`);
    return data;
  }

  async downloadAttachment(messageId: string, attachment: string): Promise<Blob> {
    const { data } = await this.client.get<Blob>(
      `/messages/${messageId}/attachments/${encodeURIComponent(attachment)}`,
      { responseType: 'blob' }
    );
    return data;
  }
}

export default new MessagingService();
