<template>
  <div style="display: flex; flex-direction: column; gap: var(--space-md)">
    <div class="admin__kpis">
      <div class="admin__kpi">
        <i class="bi bi-chat-left-text"></i>
        <span class="admin__kpi-body">
          <span class="admin__kpi-value">{{ stats.totalPosts }}</span>
          <span class="admin__kpi-label">Posts</span>
        </span>
      </div>
      <div class="admin__kpi admin__kpi--info">
        <i class="bi bi-reply"></i>
        <span class="admin__kpi-body">
          <span class="admin__kpi-value">{{ stats.totalReplies }}</span>
          <span class="admin__kpi-label">Réponses</span>
        </span>
      </div>
      <div class="admin__kpi admin__kpi--success">
        <i class="bi bi-calendar-day"></i>
        <span class="admin__kpi-body">
          <span class="admin__kpi-value">{{ stats.todayPosts }}</span>
          <span class="admin__kpi-label">Aujourd'hui</span>
        </span>
      </div>
    </div>

    <div class="admin__panel">
      <div class="admin__panel-header">
        <div class="admin__toolbar">
          <input
            v-model="state.search"
            type="search"
            class="admin__input admin__input--search"
            placeholder="Rechercher un contenu…"
            @input="debouncedSearch"
          />
          <select v-model="state.type" class="admin__select" @change="commit({ page: 1 })">
            <option value="">Posts et réponses</option>
            <option value="post">Posts uniquement</option>
            <option value="reply">Réponses uniquement</option>
          </select>
        </div>
      </div>

      <div v-if="posts.length === 0" class="admin__empty">
        <i class="bi bi-chat-left-text"></i>
        <p>{{ loading ? 'Chargement…' : 'Aucun contenu pour ce filtre.' }}</p>
      </div>

      <div v-else class="admin__table-wrapper">
        <table class="admin__table">
          <thead>
            <tr>
              <th>Auteur</th>
              <th>Contenu</th>
              <th>Type</th>
              <th>Publié</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in posts" :key="post._id">
              <td>
                <div class="admin__user-cell">
                  <span class="admin__avatar-letter">{{ getInitial(post.author?.username) }}</span>
                  {{ post.author?.username || 'Compte supprimé' }}
                  <VerifiedBadge v-if="post.author?.isIdentityVerified" :size="12" />
                </div>
              </td>
              <td><span class="admin__excerpt" :title="post.content">{{ post.content }}</span></td>
              <td>
                <span class="admin__badge" :class="post.isReply ? 'admin__badge--info' : 'admin__badge--accent'">
                  {{ post.isReply ? 'Réponse' : 'Post' }}
                </span>
              </td>
              <td class="admin__cell-nowrap admin__muted">{{ formatDateTime(post.createdAt) }}</td>
              <td>
                <button
                  type="button"
                  class="admin__icon-btn admin__icon-btn--danger"
                  title="Supprimer le contenu"
                  @click="postToDelete = post"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination.totalPages > 1" class="admin__pagination">
        <button
          type="button"
          class="admin__icon-btn"
          :disabled="state.page <= 1"
          @click="commit({ page: state.page - 1 })"
        >
          <i class="bi bi-chevron-left"></i>
        </button>
        <span>{{ state.page }} / {{ pagination.totalPages }}</span>
        <button
          type="button"
          class="admin__icon-btn"
          :disabled="state.page >= pagination.totalPages"
          @click="commit({ page: state.page + 1 })"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>

    <ReasonPromptModal
      v-if="postToDelete"
      :title="postToDelete.isReply ? 'Supprimer cette réponse' : 'Supprimer cette publication'"
      :description="postToDelete.content"
      :presets="POST_DELETION_REASONS"
      confirm-label="Supprimer"
      confirm-icon="bi bi-trash"
      destructive
      required
      @cancel="postToDelete = null"
      @confirm="remove"
    />
  </div>
</template>

<script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue';
  import adminService from '@/services/admin.service';
  import VerifiedBadge from '@/components/VerifiedBadge.vue';
  import { func } from '@/function';
  import ReasonPromptModal from '../components/ReasonPromptModal.vue';
  import { POST_DELETION_REASONS } from '../adminPresets';
  import { useAdminQueryState } from '../useAdminQueryState';
  import { apiErrorMessage, formatDateTime, getInitial } from '../adminFormat';

  const SEARCH_DEBOUNCE_MS = 300;

  export default defineComponent({
    name: 'ModerationPanel',
    components: { ReasonPromptModal, VerifiedBadge },
    emits: ['changed'],
    setup(_props, { emit }) {
      const posts = ref<any[]>([]);
      const stats = ref({ totalPosts: 0, totalReplies: 0, todayPosts: 0 });
      const pagination = ref({ totalPages: 1 });
      const loading = ref(false);
      const postToDelete = ref<any>(null);

      const { state, commit } = useAdminQueryState({ search: '', type: '', page: 1 }, () => load());

      const load = async () => {
        loading.value = true;
        try {
          const [postsData, statsData] = await Promise.all([
            adminService.getAdminPosts({
              page: state.page,
              search: state.search.trim() || undefined,
              type: state.type || undefined
            }),
            adminService.getPostStats()
          ]);
          posts.value = postsData.posts || [];
          pagination.value = postsData.pagination || { totalPages: 1 };
          stats.value = statsData;
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger les posts'));
          posts.value = [];
        } finally {
          loading.value = false;
        }
      };

      let searchTimer: ReturnType<typeof setTimeout> | null = null;
      const debouncedSearch = () => {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => commit({ page: 1 }), SEARCH_DEBOUNCE_MS);
      };

      const remove = async (reason: string) => {
        const post = postToDelete.value;
        if (!post) return;

        try {
          await adminService.adminDeletePost(post._id, reason);
          func.showToastSuccess(post.isReply ? 'Réponse supprimée' : 'Post supprimé');
          postToDelete.value = null;
          await load();
          emit('changed');
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La suppression a échoué'));
        }
      };

      onMounted(load);

      return {
        POST_DELETION_REASONS,
        state,
        commit,
        posts,
        stats,
        pagination,
        loading,
        postToDelete,
        formatDateTime,
        getInitial,
        debouncedSearch,
        remove
      };
    }
  });
</script>
