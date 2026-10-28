<template>
  <main class="page">
    <div class="saved-searches">
      <div class="saved-searches__header">
        <h1 class="saved-searches__title">
          <i class="bi bi-bookmark-star"></i>
          Recherches sauvegardées
        </h1>
        <p class="saved-searches__subtitle">
          Activez les alertes pour être prévenu(e) des nouvelles annonces correspondantes (au plus une notification par heure et par recherche).
        </p>
      </div>

      <div v-if="loading" class="saved-searches__loading">
        <div class="skeleton" style="height: 88px;"></div>
        <div class="skeleton" style="height: 88px;"></div>
      </div>

      <ul v-else-if="savedSearches.length > 0" class="saved-searches__list">
        <li v-for="search in savedSearches" :key="search._id" class="saved-search" data-test="saved-search">
          <div class="saved-search__main">
            <form v-if="editingId === search._id" class="saved-search__rename" @submit.prevent="saveName(search)">
              <input
                v-model="draftName"
                class="saved-search__input"
                :maxlength="SAVED_SEARCH_NAME_MAX_LENGTH"
                aria-label="Nom de la recherche"
                data-test="rename-input"
              />
              <button type="submit" class="btn btn-primary btn-sm" data-test="rename-save">Enregistrer</button>
              <button type="button" class="btn btn-ghost btn-sm" @click="editingId = null">Annuler</button>
            </form>
            <h3 v-else class="saved-search__name">{{ search.name }}</h3>
            <div class="saved-search__criteria">
              <span v-for="part in describeCriteria(search.criteria, catalogLabels)" :key="part" class="saved-search__chip">{{ part }}</span>
            </div>
          </div>

          <div class="saved-search__actions">
            <label class="saved-search__toggle">
              <input
                type="checkbox"
                :checked="search.alertsEnabled"
                data-test="alerts-toggle"
                @click.prevent="toggleAlerts(search)"
              />
              <span>Alertes</span>
            </label>
            <router-link :to="searchRouteForCriteria(search.criteria)" class="btn btn-primary btn-sm" data-test="launch">
              <i class="bi bi-search"></i> Lancer
            </router-link>
            <button type="button" class="btn btn-ghost btn-sm" data-test="rename" @click="startRename(search)">
              <i class="bi bi-pencil"></i> Renommer
            </button>
            <button type="button" class="btn btn-ghost btn-sm saved-search__delete" data-test="delete" @click="remove(search)">
              <i class="bi bi-trash"></i> Supprimer
            </button>
          </div>
        </li>
      </ul>

      <div v-else class="saved-searches__empty">
        <i class="bi bi-bookmark"></i>
        <h3>Aucune recherche sauvegardée</h3>
        <p class="text-muted">Lancez une recherche puis cliquez sur « Sauvegarder cette recherche ».</p>
        <router-link :to="{ name: 'searchList' }" class="btn btn-primary">
          <i class="bi bi-search"></i> Rechercher
        </router-link>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import savedSearchService, { type SavedSearch } from '@/services/savedSearch.service';
import { apiErrorMessage } from '@/services/apiError';
import { func } from '@/function';
import groupService from '@/services/group.service';
import albumService from '@/services/album.service';
import {
  describeCriteria,
  searchRouteForCriteria,
  SAVED_SEARCH_NAME_MAX_LENGTH,
  type CatalogLabels
} from '@/utils/savedSearch';

const savedSearches = ref<SavedSearch[]>([]);
const loading = ref(true);
const editingId = ref<string | null>(null);
const draftName = ref('');
const catalogLabels = ref<CatalogLabels>({});

onMounted(async () => {
  try {
    savedSearches.value = await savedSearchService.list();
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'Impossible de charger vos recherches sauvegardées'));
  } finally {
    loading.value = false;
  }
  void loadCatalogLabels();
});

/**
 * Les critères du catalogue sont enregistrés par identifiant : leurs noms sont
 * chargés après la liste (au plus 20 recherches). Un nom introuvable laisse un
 * libellé générique plutôt que de bloquer la page.
 */
async function loadCatalogLabels() {
  const groupIds = new Set(savedSearches.value.map((search) => search.criteria.group).filter(Boolean) as string[]);
  const albumIds = new Set(savedSearches.value.map((search) => search.criteria.album).filter(Boolean) as string[]);
  const entries = await Promise.all([
    ...[...groupIds].map((id) => groupService.getGroup(id).then((group) => [id, group.name] as const, () => null)),
    ...[...albumIds].map((id) => albumService.getAlbum(id).then((album) => [id, album.name] as const, () => null))
  ]);
  catalogLabels.value = Object.fromEntries(entries.filter((entry) => entry !== null));
}

/** Remplace la recherche par la version renvoyée par l'API, source de vérité. */
function replace(updated: SavedSearch) {
  savedSearches.value = savedSearches.value.map((search) => (search._id === updated._id ? updated : search));
}

function startRename(search: SavedSearch) {
  editingId.value = search._id;
  draftName.value = search.name;
}

async function saveName(search: SavedSearch) {
  const name = draftName.value.trim();
  if (!name) {
    func.showToastError('Le nom ne peut pas être vide');
    return;
  }
  try {
    replace(await savedSearchService.update(search._id, { name }));
    editingId.value = null;
    func.showToastSuccess('Recherche renommée');
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'Impossible de renommer la recherche'));
  }
}

async function toggleAlerts(search: SavedSearch) {
  const alertsEnabled = !search.alertsEnabled;
  try {
    replace(await savedSearchService.update(search._id, { alertsEnabled }));
    func.showToastSuccess(alertsEnabled ? 'Alertes activées' : 'Alertes désactivées');
  } catch (error) {
    // `click.prevent` : la case ne bascule qu'une fois l'API d'accord, rien à annuler ici.
    func.showToastError(apiErrorMessage(error, 'Impossible de modifier les alertes'));
  }
}

async function remove(search: SavedSearch) {
  if (!window.confirm(`Supprimer la recherche « ${search.name} » ?`)) return;
  try {
    await savedSearchService.remove(search._id);
    savedSearches.value = savedSearches.value.filter((item) => item._id !== search._id);
    func.showToastSuccess('Recherche supprimée');
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'Impossible de supprimer la recherche'));
  }
}
</script>

<style lang="scss" scoped>
.saved-searches {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg);
}

.saved-searches__header {
  margin-bottom: var(--space-xl);
}

.saved-searches__title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0 0 var(--space-xs);

  i { color: var(--accent-pink); }
}

.saved-searches__subtitle {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  margin: 0;
}

.saved-searches__loading,
.saved-searches__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  list-style: none;
  padding: 0;
  margin: 0;
}

.saved-search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
}

.saved-search__main {
  flex: 1 1 280px;
  min-width: 0;
}

.saved-search__name {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--space-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.saved-search__rename {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.saved-search__input {
  flex: 1 1 180px;
  padding: 6px 12px;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.saved-search__criteria {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.saved-search__chip {
  padding: 2px 10px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
}

.saved-search__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
}

.saved-search__toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;

  input { accent-color: var(--accent-pink); }
}

.saved-search__delete:hover {
  color: var(--danger, var(--danger-text));
}

.saved-searches__empty {
  text-align: center;
  padding: var(--space-3xl);

  > i {
    font-size: 3rem;
    color: var(--text-muted);
    margin-bottom: var(--space-md);
    display: block;
  }

  h3 {
    font-size: var(--font-size-lg);
    color: var(--text-primary);
    margin: 0 0 var(--space-xs);
  }

  .btn {
    margin-top: var(--space-lg);
  }
}
</style>
