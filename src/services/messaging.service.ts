// services/messaging.service.ts - Version entièrement typée et mise à jour

import axios, { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  ConversationListResponse,
  ConversationDetailResponse,
  SendMessageRequest,
  SendMessageResponse,
  NegotiationRequest,
  NegotiationResponse,
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
import type { IUser, UserResponse } from '@/types/user.types';

const API_BASE_URL = import.meta.env.VITE_API_URL + '/api' || 'http://localhost:3000/api';

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

type AuthToken = string | null;


class MessagingService {
  private apiClient: AxiosInstance;
  private userApiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_BASE_URL}/messaging`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.userApiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configuration des intercepteurs pour les deux clients
    this.setupInterceptors(this.apiClient);
    this.setupInterceptors(this.userApiClient);
  }

  private setupInterceptors(client: AxiosInstance): void {
    // Intercepteur pour ajouter le token JWT ou le cookie PHPSESSID
    client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs
    client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): AuthToken {
    // Récupère le cookie PHPSESSID si présent
    const PHPSESSID = this.getCookieValue('PHPSESSID');
    if (PHPSESSID) {
      return PHPSESSID;
    }

    // Sinon, récupère le token du localStorage
    return localStorage.getItem('token');
  }

  private getCookieValue(name: string): string | null {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`));

    return cookie ? cookie.split('=')[1] : null;
  }

  private handleUnauthorized(): void {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  // Récupérer les conversations de l'utilisateur
  async getUserConversations(params?: ConversationListParams): Promise<ConversationListResponse> {
    try {
      const response: AxiosResponse<ConversationListResponse> = await this.apiClient.get('/', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      throw this.handleError(error);
    }
  }

  // Récupérer une conversation spécifique avec ses messages
  async getConversation(
    conversationId: string,
    params?: ConversationDetailParams
  ): Promise<ConversationDetailResponse> {
    if (!conversationId.trim()) {
      throw new Error('ID de conversation requis');
    }

    try {
      const response: AxiosResponse<ConversationDetailResponse> = await this.apiClient.get(`/${conversationId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la conversation ${conversationId}:`, error);
      throw this.handleError(error);
    }
  }

  // Créer une nouvelle conversation
  async startConversation(data: StartConversationRequest): Promise<StartConversationResponse> {
    if (!data.recipientId?.trim()) {
      throw new Error('ID du destinataire requis');
    }

    try {
      const response: AxiosResponse<StartConversationResponse> = await this.apiClient.post('/', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      throw this.handleError(error);
    }
  }

  // Envoyer un message
  async sendMessage(
    conversationId: string,
    data: SendMessageRequest
  ): Promise<SendMessageResponse> {
    if (!conversationId.trim()) {
      throw new Error('ID de conversation requis');
    }

    if (!data.content?.trim()) {
      throw new Error('Contenu du message requis');
    }

    try {
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('contentType', data.contentType || 'text');

      // Ajouter les pièces jointes si présentes
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      const response: AxiosResponse<SendMessageResponse> = await this.apiClient.post(
        `/${conversationId}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'envoi du message dans la conversation ${conversationId}:`, error);
      throw this.handleError(error);
    }
  }

  // Marquer une conversation comme lue
  async markConversationAsRead(conversationId: string): Promise<void> {
    if (!conversationId.trim()) {
      throw new Error('ID de conversation requis');
    }

    try {
      await this.apiClient.put(`/${conversationId}/read`);
    } catch (error) {
      console.error(`Erreur lors du marquage comme lu de la conversation ${conversationId}:`, error);
      throw this.handleError(error);
    }
  }

  // Supprimer un message
  async deleteMessage(messageId: string): Promise<void> {
    if (!messageId.trim()) {
      throw new Error('ID de message requis');
    }

    try {
      await this.apiClient.delete(`/messages/${messageId}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du message ${messageId}:`, error);
      throw this.handleError(error);
    }
  }

  // Récupérer une pièce jointe
  getAttachmentUrl(messageId: string, attachmentName: string): string {
    if (!messageId.trim() || !attachmentName.trim()) {
      throw new Error('ID de message et nom de la pièce jointe requis');
    }

    const token = this.getAuthToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

    return `${API_BASE_URL}/messaging/messages/${messageId}/attachments/${attachmentName}${tokenParam}`;
  }

  // Initier une négociation
  async initiateNegotiation(data: NegotiationRequest): Promise<NegotiationResponse> {
    if (!data.productId?.trim()) {
      throw new Error('ID du produit requis');
    }

    if (!data.recipientId?.trim()) {
      throw new Error('ID du destinataire requis');
    }

    if (typeof data.proposedPrice !== 'number' || data.proposedPrice <= 0) {
      throw new Error('Prix proposé invalide');
    }

    try {
      const response: AxiosResponse<NegotiationResponse> = await this.apiClient.post('/negotiate', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'initiation de la négociation:', error);
      throw this.handleError(error);
    }
  }

  // Répondre à une négociation
  async respondToNegotiation(
    conversationId: string,
    data: NegotiationActionRequest
  ): Promise<NegotiationActionResponse> {
    if (!conversationId.trim()) {
      throw new Error('ID de conversation requis');
    }

    const validActions: NegotiationActionRequest['action'][] = ['accept', 'reject', 'counter'];
    if (!validActions.includes(data.action)) {
      throw new Error('Action invalide');
    }

    if (data.action === 'counter' && (typeof data.counterOffer !== 'number' || data.counterOffer <= 0)) {
      throw new Error('Contre-offre invalide');
    }

    try {
      const response: AxiosResponse<NegotiationActionResponse> = await this.apiClient.post(`/${conversationId}/respond`, data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la réponse à la négociation ${conversationId}:`, error);
      throw this.handleError(error);
    }
  }

  // Initier Pay What You Want
  async initiatePayWhatYouWant(data: PayWhatYouWantRequest): Promise<PayWhatYouWantResponse> {
    if (!data.productId?.trim()) {
      throw new Error('ID du produit requis');
    }

    if (typeof data.minimumPrice !== 'number' || data.minimumPrice < 0) {
      throw new Error('Prix minimum invalide');
    }

    if (data.maximumPrice && (typeof data.maximumPrice !== 'number' || data.maximumPrice <= data.minimumPrice)) {
      throw new Error('Prix maximum invalide');
    }

    try {
      const response: AxiosResponse<PayWhatYouWantResponse> = await this.apiClient.post('/pwyw', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'initiation du Pay What You Want:', error);
      throw this.handleError(error);
    }
  }

  // Faire une proposition PWYW
  async makePayWhatYouWantOffer(
    conversationId: string,
    data: PayWhatYouWantOfferRequest
  ): Promise<PayWhatYouWantOfferResponse> {
    if (!conversationId.trim()) {
      throw new Error('ID de conversation requis');
    }

    if (typeof data.proposedPrice !== 'number' || data.proposedPrice <= 0) {
      throw new Error('Prix proposé invalide');
    }

    try {
      const response: AxiosResponse<PayWhatYouWantOfferResponse> = await this.apiClient.post(`/${conversationId}/pwyw-offer`, data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la proposition PWYW ${conversationId}:`, error);
      throw this.handleError(error);
    }
  }

  // Récupérer un utilisateur par son ID
  async getUserById(userId: string): Promise<IUser> {
    if (!userId.trim()) {
      throw new Error('ID utilisateur requis');
    }

    try {
      const response: AxiosResponse<UserResponse | IUser> = await this.userApiClient.get(`/users/${userId}`);

      // Gérer les deux formats de réponse possibles
      if ('user' in response.data) {
        return (response.data as UserResponse).user;
      }

      return response.data as IUser;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'utilisateur ${userId}:`, error);
      throw this.handleError(error);
    }
  }

  // Gestion centralisée des erreurs
  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; code?: string }>;

      return {
        message: axiosError.response?.data?.message || axiosError.message || 'Une erreur est survenue',
        status: axiosError.response?.status,
        code: axiosError.response?.data?.code
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message
      };
    }

    return {
      message: 'Une erreur inconnue est survenue'
    };
  }
}

export default new MessagingService();
