<template>
  <div class="admin__panel">
    <div class="admin__panel-header">
      <div class="admin__toolbar">
        <button
          type="button"
          class="admin__btn"
          :class="{ 'admin__btn--primary': subTab === 'groups' }"
          @click="subTab = 'groups'"
        >
          <i class="bi bi-people-fill"></i> Groupes ({{ groups.length }})
        </button>
        <button
          type="button"
          class="admin__btn"
          :class="{ 'admin__btn--primary': subTab === 'albums' }"
          @click="subTab = 'albums'"
        >
          <i class="bi bi-disc"></i> Albums ({{ albums.length }})
        </button>
      </div>
    </div>

    <div class="admin__panel-header">
      <input
        v-if="subTab === 'groups'"
        v-model="groupSearch"
        type="search"
        class="admin__input admin__input--search"
        placeholder="Rechercher un groupe…"
        @input="debouncedSearchGroups"
      />
      <input
        v-else
        v-model="albumSearch"
        type="search"
        class="admin__input admin__input--search"
        placeholder="Rechercher un album…"
        @input="debouncedSearchAlbums"
      />
      <button type="button" class="admin__btn admin__btn--primary" @click="openForm()">
        <i class="bi bi-plus-lg"></i> Ajouter
      </button>
    </div>

    <template v-if="subTab === 'groups'">
      <div v-if="groups.length === 0" class="admin__empty">
        <i class="bi bi-people"></i>
        <p>{{ loading ? 'Chargement…' : 'Aucun groupe trouvé.' }}</p>
      </div>
      <div v-else class="admin__table-wrapper">
        <table class="admin__table">
          <thead>
            <tr>
              <th>Nom</th>
              <th class="admin__cell-numeric">Membres</th>
              <th class="admin__cell-numeric">Followers</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in groups" :key="group._id">
              <td>
                <div class="admin__user-cell">
                  <img v-if="group.image" :src="group.image" class="admin__thumb" alt="" />
                  <span v-else class="admin__avatar-letter">{{ getInitial(group.name) }}</span>
                  {{ group.name }}
                </div>
              </td>
              <td class="admin__cell-numeric">{{ group.members?.length || 0 }}</td>
              <td class="admin__cell-numeric">{{ group.followersCount || 0 }}</td>
              <td class="admin__cell-nowrap">
                <div class="admin__actions">
                  <button type="button" class="admin__icon-btn" title="Voir les followers" @click="viewFollowers(group)">
                    <i class="bi bi-people"></i>
                  </button>
                  <button type="button" class="admin__icon-btn" title="Modifier" @click="openForm(group)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    type="button"
                    class="admin__icon-btn admin__icon-btn--danger"
                    title="Supprimer"
                    @click="removeGroup(group)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else>
      <div v-if="albums.length === 0" class="admin__empty">
        <i class="bi bi-disc"></i>
        <p>{{ loading ? 'Chargement…' : 'Aucun album trouvé.' }}</p>
      </div>
      <div v-else class="admin__table-wrapper">
        <table class="admin__table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Groupe</th>
              <th>Type</th>
              <th>Sortie</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="album in albums" :key="album._id">
              <td>
                <div class="admin__user-cell">
                  <img v-if="album.coverImage" :src="album.coverImage" class="admin__thumb" alt="" />
                  <span v-else class="admin__avatar-letter">{{ getInitial(album.name) }}</span>
                  {{ album.name }}
                </div>
              </td>
              <td class="admin__muted">{{ (album as any).artistName || '—' }}</td>
              <td>
                <span class="admin__badge admin__badge--accent">
                  {{ ALBUM_TYPE_LABELS[albumType(album)] || albumType(album) || '—' }}
                </span>
              </td>
              <td class="admin__cell-nowrap admin__muted">{{ formatDate(album.releaseDate) }}</td>
              <td class="admin__cell-nowrap">
                <div class="admin__actions">
                  <button type="button" class="admin__icon-btn" title="Modifier" @click="openForm(album)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    type="button"
                    class="admin__icon-btn admin__icon-btn--danger"
                    title="Supprimer"
                    @click="removeAlbum(album)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-if="showGroupForm" class="admin__modal-overlay" @click.self="showGroupForm = false">
      <div class="admin__modal" role="dialog" aria-modal="true">
        <div class="admin__modal-header">
          <h3>{{ editing ? 'Modifier le groupe' : 'Nouveau groupe' }}</h3>
          <button type="button" class="admin__icon-btn" aria-label="Fermer" @click="showGroupForm = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <form class="admin__modal-body" @submit.prevent="submitGroup">
          <div class="admin__field">
            <label for="group-name">Nom</label>
            <input id="group-name" v-model="groupForm.name" type="text" class="admin__input" required />
          </div>
          <div class="admin__field">
            <label for="group-image">Image (URL)</label>
            <input id="group-image" v-model="groupForm.image" type="url" class="admin__input" placeholder="https://…" />
          </div>
          <div class="admin__field">
            <label for="group-members">Membres</label>
            <input
              id="group-members"
              v-model="groupForm.membersRaw"
              type="text"
              class="admin__input"
              placeholder="Jisoo, Jennie, Rosé, Lisa"
            />
            <span class="admin__hint">Séparés par des virgules.</span>
          </div>
        </form>
        <div class="admin__modal-footer">
          <button type="button" class="admin__btn admin__btn--ghost" @click="showGroupForm = false">Annuler</button>
          <button type="button" class="admin__btn admin__btn--primary" :disabled="submitting" @click="submitGroup">
            {{ editing ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAlbumForm" class="admin__modal-overlay" @click.self="showAlbumForm = false">
      <div class="admin__modal" role="dialog" aria-modal="true">
        <div class="admin__modal-header">
          <h3>{{ editing ? 'Modifier l\'album' : 'Nouvel album' }}</h3>
          <button type="button" class="admin__icon-btn" aria-label="Fermer" @click="showAlbumForm = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <form class="admin__modal-body" @submit.prevent="submitAlbum">
          <div class="admin__field">
            <label for="album-name">Nom</label>
            <input id="album-name" v-model="albumForm.name" type="text" class="admin__input" required />
          </div>
          <div class="admin__field">
            <label for="album-group">Groupe</label>
            <select id="album-group" v-model="albumForm.group" class="admin__select">
              <option value="">— Aucun —</option>
              <option v-for="group in groups" :key="group._id" :value="group._id">{{ group.name }}</option>
            </select>
          </div>
          <div class="admin__field">
            <label for="album-type">Type</label>
            <select id="album-type" v-model="albumForm.type" class="admin__select">
              <option value="">—</option>
              <option v-for="(label, value) in ALBUM_TYPE_LABELS" :key="value" :value="value">{{ label }}</option>
            </select>
          </div>
          <div class="admin__field">
            <label for="album-date">Date de sortie</label>
            <input id="album-date" v-model="albumForm.releaseDate" type="date" class="admin__input" />
          </div>
          <div class="admin__field">
            <label for="album-cover">Cover (URL)</label>
            <input id="album-cover" v-model="albumForm.coverImage" type="url" class="admin__input" placeholder="https://…" />
          </div>
        </form>
        <div class="admin__modal-footer">
          <button type="button" class="admin__btn admin__btn--ghost" @click="showAlbumForm = false">Annuler</button>
          <button type="button" class="admin__btn admin__btn--primary" :disabled="submitting" @click="submitAlbum">
            {{ editing ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="followersGroup" class="admin__modal-overlay" @click.self="followersGroup = null">
      <div class="admin__modal" role="dialog" aria-modal="true">
        <div class="admin__modal-header">
          <h3>Followers de {{ followersGroup.name }}</h3>
          <button type="button" class="admin__icon-btn" aria-label="Fermer" @click="followersGroup = null">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="admin__modal-body">
          <p v-if="followers.length === 0" class="admin__muted" style="margin: 0">Aucun follower.</p>
          <dl v-else class="admin__definition-list">
            <div v-for="follower in followers" :key="follower._id" class="admin__definition">
              <dt>
                <span class="admin__user-cell">
                  <span class="admin__avatar-letter">{{ getInitial(follower.username) }}</span>
                  {{ follower.username }}
                </span>
              </dt>
              <dd></dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue';
  import albumService, { type KpopAlbum } from '@/services/album.service';
  import groupService, { type KpopGroup } from '@/services/group.service';
  import { func } from '@/function';
  import { apiErrorMessage, formatDate, getInitial } from '../adminFormat';

  const CATALOG_LIMIT = 2000;
  const SEARCH_DEBOUNCE_MS = 300;
  const FOLLOWERS_PAGE_SIZE = 50;

  const ALBUM_TYPE_LABELS: Record<string, string> = {
    mini: 'Mini album',
    full: 'Full album',
    single: 'Single',
    repackage: 'Repackage',
    special: 'Special'
  };

  export default defineComponent({
    name: 'KpopPanel',
    setup() {
      const subTab = ref<'groups' | 'albums'>('groups');
      const groups = ref<KpopGroup[]>([]);
      const albums = ref<KpopAlbum[]>([]);
      const groupSearch = ref('');
      const albumSearch = ref('');
      const loading = ref(false);
      const submitting = ref(false);

      const showGroupForm = ref(false);
      const showAlbumForm = ref(false);
      const editing = ref<any>(null);
      const groupForm = ref({ name: '', image: '', membersRaw: '' });
      const albumForm = ref({ name: '', group: '', type: '', releaseDate: '', coverImage: '' });

      const followersGroup = ref<KpopGroup | null>(null);
      const followers = ref<any[]>([]);

      const albumType = (album: KpopAlbum): string => (album as any).albumType || album.type || '';

      const load = async () => {
        loading.value = true;
        try {
          const [loadedGroups, loadedAlbums] = await Promise.all([
            groupService.getGroups({ limit: CATALOG_LIMIT }),
            albumService.getAlbums({ limit: CATALOG_LIMIT })
          ]);
          groups.value = loadedGroups;
          albums.value = loadedAlbums;
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger le catalogue K-pop'));
        } finally {
          loading.value = false;
        }
      };

      const debounce = (action: () => void) => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        return () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(action, SEARCH_DEBOUNCE_MS);
        };
      };

      const debouncedSearchGroups = debounce(async () => {
        const term = groupSearch.value.trim();
        groups.value = term
          ? await groupService.searchGroups(term, true)
          : await groupService.getGroups({ limit: CATALOG_LIMIT });
      });

      const debouncedSearchAlbums = debounce(async () => {
        const term = albumSearch.value.trim();
        albums.value = term
          ? await albumService.searchAlbums(term, CATALOG_LIMIT)
          : await albumService.getAlbums({ limit: CATALOG_LIMIT });
      });

      const openForm = (entity?: any) => {
        editing.value = entity ?? null;

        if (subTab.value === 'groups') {
          groupForm.value = entity
            ? {
                name: entity.name,
                image: entity.image || '',
                membersRaw: (entity.members || []).join(', ')
              }
            : { name: '', image: '', membersRaw: '' };
          showGroupForm.value = true;
          return;
        }

        albumForm.value = entity
          ? {
              name: entity.name,
              group: entity.group?._id || entity.group || '',
              type: albumType(entity),
              releaseDate: entity.releaseDate ? String(entity.releaseDate).substring(0, 10) : '',
              coverImage: entity.coverImage || ''
            }
          : { name: '', group: '', type: '', releaseDate: '', coverImage: '' };
        showAlbumForm.value = true;
      };

      const submitGroup = async () => {
        if (submitting.value) return;

        const payload: any = { name: groupForm.value.name.trim() };
        if (groupForm.value.image) payload.image = groupForm.value.image;
        if (groupForm.value.membersRaw.trim()) {
          payload.members = groupForm.value.membersRaw
            .split(',')
            .map((member) => member.trim())
            .filter(Boolean);
        }

        submitting.value = true;
        try {
          if (editing.value) {
            await groupService.updateGroup(editing.value._id, payload);
            func.showToastSuccess('Groupe modifié');
          } else {
            await groupService.createGroup(payload);
            func.showToastSuccess('Groupe créé');
          }
          showGroupForm.value = false;
          await load();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'L\'enregistrement a échoué'));
        } finally {
          submitting.value = false;
        }
      };

      const submitAlbum = async () => {
        if (submitting.value) return;

        const payload: any = { name: albumForm.value.name.trim() };
        if (albumForm.value.group) payload.group = albumForm.value.group;
        if (albumForm.value.type) payload.type = albumForm.value.type;
        if (albumForm.value.releaseDate) payload.releaseDate = albumForm.value.releaseDate;
        if (albumForm.value.coverImage) payload.coverImage = albumForm.value.coverImage;

        submitting.value = true;
        try {
          if (editing.value) {
            await albumService.updateAlbum(editing.value._id, payload);
            func.showToastSuccess('Album modifié');
          } else {
            await albumService.createAlbum(payload);
            func.showToastSuccess('Album créé');
          }
          showAlbumForm.value = false;
          await load();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'L\'enregistrement a échoué'));
        } finally {
          submitting.value = false;
        }
      };

      const removeGroup = async (group: KpopGroup) => {
        if (!confirm(`Supprimer le groupe « ${group.name} » ?`)) return;

        try {
          await groupService.deleteGroup(group._id);
          func.showToastSuccess('Groupe supprimé');
          await load();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La suppression a échoué'));
        }
      };

      const removeAlbum = async (album: KpopAlbum) => {
        if (!confirm(`Supprimer l'album « ${album.name} » ?`)) return;

        try {
          await albumService.deleteAlbum(album._id);
          func.showToastSuccess('Album supprimé');
          await load();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La suppression a échoué'));
        }
      };

      const viewFollowers = async (group: KpopGroup) => {
        followersGroup.value = group;
        try {
          const data = await groupService.getFollowers(group._id, 1, FOLLOWERS_PAGE_SIZE);
          followers.value = (data as any).followers || data || [];
        } catch {
          followers.value = [];
        }
      };

      onMounted(load);

      return {
        ALBUM_TYPE_LABELS,
        subTab,
        groups,
        albums,
        groupSearch,
        albumSearch,
        loading,
        submitting,
        showGroupForm,
        showAlbumForm,
        editing,
        groupForm,
        albumForm,
        followersGroup,
        followers,
        albumType,
        formatDate,
        getInitial,
        debouncedSearchGroups,
        debouncedSearchAlbums,
        openForm,
        submitGroup,
        submitAlbum,
        removeGroup,
        removeAlbum,
        viewFollowers
      };
    }
  });
</script>
