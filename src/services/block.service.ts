import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

const client = createApiClient({ baseURL: `${API_URL}/api/users` });

/** Code d'erreur de l'API quand une interaction est refusée pour cause de blocage. */
export const BLOCKED_ERROR_CODE = 'BLOCKED';

/** Situation de blocage entre le membre connecté et un autre membre. */
export interface BlockStatus {
  /** Un blocage existe, dans un sens ou dans l'autre. */
  isBlocked: boolean;
  /** C'est moi qui ai bloqué (je peux donc débloquer). */
  blockedByMe: boolean;
}

export interface BlockedUser {
  _id: string;
  username: string;
  profilePicture?: string;
  blockedAt: string;
}

export interface BlockedUsersPage {
  blockedUsers: BlockedUser[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
}

class BlockService {
  async getStatus(userId: string): Promise<BlockStatus> {
    const res = await client.get<BlockStatus>(`/${userId}/block`);
    return res.data;
  }

  async block(userId: string): Promise<void> {
    await client.post(`/${userId}/block`);
  }

  async unblock(userId: string): Promise<void> {
    await client.delete(`/${userId}/block`);
  }

  async listBlocked(page = 1, limit = 20): Promise<BlockedUsersPage> {
    const res = await client.get<BlockedUsersPage>('/me/blocked', { params: { page, limit } });
    return res.data;
  }
}

export default new BlockService();
