import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';
import type { AdvancedSearchPayload } from '@/services/search.service';

/** Critères enregistrés : ceux de la recherche avancée, sans pagination ni tri. */
export type SavedSearchCriteria = Pick<
  AdvancedSearchPayload,
  | 'query' | 'groups' | 'members' | 'albums' | 'priceRange' | 'condition' | 'type' | 'currency'
  | 'group' | 'member' | 'album' | 'version' | 'isOfficial'
>;

export interface SavedSearch {
  _id: string;
  name: string;
  criteria: SavedSearchCriteria;
  alertsEnabled: boolean;
  lastNotifiedAt: string | null;
  createdAt: string;
}

const client = createApiClient({ baseURL: `${API_URL}/api/saved-searches` });

class SavedSearchService {
  async list(): Promise<SavedSearch[]> {
    const res = await client.get<{ savedSearches: SavedSearch[] }>('');
    return res.data.savedSearches;
  }

  async create(payload: { name: string; criteria: SavedSearchCriteria }): Promise<SavedSearch> {
    const res = await client.post<{ savedSearch: SavedSearch }>('', payload);
    return res.data.savedSearch;
  }

  async update(id: string, changes: { name?: string; alertsEnabled?: boolean }): Promise<SavedSearch> {
    const res = await client.patch<{ savedSearch: SavedSearch }>(`/${id}`, changes);
    return res.data.savedSearch;
  }

  async remove(id: string): Promise<void> {
    await client.delete(`/${id}`);
  }
}

export default new SavedSearchService();
