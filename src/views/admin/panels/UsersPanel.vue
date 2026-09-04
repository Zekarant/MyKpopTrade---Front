<template>
  <div class="admin__panel">
    <div class="admin__panel-header">
      <div class="admin__toolbar">
        <input
          v-model="state.search"
          type="search"
          class="admin__input admin__input--search"
          placeholder="Pseudo ou email…"
          @input="debouncedSearch"
        />
        <select v-model="state.role" class="admin__select" @change="commit({ page: 1 })">
          <option value="">Tous les rôles</option>
          <option value="user">Utilisateurs</option>
          <option value="moderator">Modérateurs</option>
          <option value="admin">Admins</option>
        </select>
        <select v-model="state.status" class="admin__select" @change="commit({ page: 1 })">
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
          <option value="deleted">Supprimés</option>
        </select>
      </div>
      <button type="button" class="admin__btn" :disabled="exporting" @click="exportCsv">
        <i class="bi bi-filetype-csv"></i> Exporter
      </button>
    </div>

    <div v-if="users.length === 0" class="admin__empty">
      <i class="bi bi-people"></i>
      <p>{{ loading ? 'Chargement…' : 'Aucun utilisateur pour ce filtre.' }}</p>
    </div>

    <div v-else class="admin__table-wrapper">
      <table class="admin__table admin__table--clickable">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Inscrit</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user._id" @click="detailUserId = user._id">
            <td>
              <div class="admin__user-cell">
                <img
                  v-if="avatarUrl(user)"
                  :src="avatarUrl(user)!"
                  class="admin__avatar"
                  alt=""
                  @error="onAvatarError(user)"
                />
                <span v-else class="admin__avatar-letter">{{ getInitial(user.username) }}</span>
                {{ user.username }}
                <VerifiedBadge v-if="user.isIdentityVerified" :size="12" />
              </div>
            </td>
            <td class="admin__muted">{{ user.email }}</td>
            <td @click.stop>
              <select
                class="admin__select"
                :value="user.role"
                :disabled="user.role === 'admin'"
                :title="user.role === 'admin' ? 'Le rôle d\'un admin ne se modifie pas ici' : 'Changer le rôle'"
                @change="changeRole(user, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="(label, value) in ROLE_LABELS" :key="value" :value="value">{{ label }}</option>
              </select>
            </td>
            <td>
              <span class="admin__badge" :class="statusBadgeClass(user.accountStatus)">
                {{ ACCOUNT_STATUS_LABELS[user.accountStatus] || user.accountStatus }}
              </span>
              <div v-if="user.suspension" class="admin__excerpt" :title="user.suspension.reason">
                {{ user.suspension.until ? `jusqu'au ${formatDate(user.suspension.until)}` : 'définitive' }}
                — {{ user.suspension.reason }}
              </div>
            </td>
            <td class="admin__cell-nowrap admin__muted">{{ formatDate(user.createdAt) }}</td>
            <td class="admin__cell-nowrap">
              <div class="admin__actions" @click.stop>
                <button
                  type="button"
                  class="admin__icon-btn"
                  title="Fiche de modération"
                  @click="detailUserId = user._id"
                >
                  <i class="bi bi-person-lines-fill"></i>
                </button>
                <button
                  v-if="user.accountStatus === 'active' && user.role !== 'admin'"
                  type="button"
                  class="admin__icon-btn admin__icon-btn--danger"
                  title="Suspendre avec motif"
                  @click="userToSuspend = user"
                >
                  <i class="bi bi-person-x"></i>
                </button>
                <button
                  v-if="user.accountStatus === 'suspended'"
                  type="button"
                  class="admin__icon-btn admin__icon-btn--success"
                  title="Réactiver le compte"
                  @click="reactivate(user)"
                >
                  <i class="bi bi-person-check"></i>
                </button>
              </div>
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
      <span>{{ state.page }} / {{ pagination.totalPages }} — {{ pagination.totalItems }} comptes</span>
      <button
        type="button"
        class="admin__icon-btn"
        :disabled="state.page >= pagination.totalPages"
        @click="commit({ page: state.page + 1 })"
      >
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>

    <UserDetailModal
      v-if="detailUserId"
      :user-id="detailUserId"
      @close="detailUserId = null"
      @suspend="onSuspendFromDetail"
      @reactivate="onReactivateFromDetail"
    />

    <SuspendUserModal
      v-if="userToSuspend"
      :user="userToSuspend"
      @close="userToSuspend = null"
      @confirmed="onSuspended"
    />
  </div>
</template>

<script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue';
  import adminService from '@/services/admin.service';
  import VerifiedBadge from '@/components/VerifiedBadge.vue';
  import { API_URL } from '@/config/api';
  import { func } from '@/function';
  import SuspendUserModal from '../components/SuspendUserModal.vue';
  import UserDetailModal from '../components/UserDetailModal.vue';
  import { useAdminQueryState } from '../useAdminQueryState';
  import {
    ACCOUNT_STATUS_LABELS,
    ROLE_LABELS,
    apiErrorMessage,
    formatDate,
    getInitial
  } from '../adminFormat';

  const PAGE_SIZE = 20;
  const SEARCH_DEBOUNCE_MS = 300;

  export default defineComponent({
    name: 'UsersPanel',
    components: { SuspendUserModal, UserDetailModal, VerifiedBadge },
    emits: ['changed'],
    setup(_props, { emit }) {
      const users = ref<any[]>([]);
      const pagination = ref({ totalPages: 1, totalItems: 0 });
      const loading = ref(false);
      const exporting = ref(false);
      const userToSuspend = ref<any>(null);
      const detailUserId = ref<string | null>(null);
      const brokenAvatars = ref<Set<string>>(new Set());

      const { state, commit } = useAdminQueryState(
        { search: '', role: '', status: '', page: 1 },
        () => load()
      );

      const statusBadgeClass = (status: string) =>
        ({
          active: 'admin__badge--success',
          suspended: 'admin__badge--warning',
          deleted: 'admin__badge--danger'
        })[status] || 'admin__badge';

      const avatarUrl = (user: any): string | null => {
        if (
          !user.profilePicture ||
          user.profilePicture.includes('avatar-default') ||
          brokenAvatars.value.has(user._id)
        ) {
          return null;
        }
        return user.profilePicture.startsWith('http')
          ? user.profilePicture
          : `${API_URL}${user.profilePicture}`;
      };

      const onAvatarError = (user: any) => {
        brokenAvatars.value = new Set(brokenAvatars.value).add(user._id);
      };

      const load = async () => {
        loading.value = true;
        try {
          const data = await adminService.getUsers({
            page: state.page,
            limit: PAGE_SIZE,
            search: state.search.trim() || undefined,
            role: state.role || undefined,
            status: state.status || undefined
          });
          users.value = data.users || [];
          pagination.value = data.pagination || { totalPages: 1, totalItems: 0 };
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger les utilisateurs'));
          users.value = [];
        } finally {
          loading.value = false;
        }
      };

      let searchTimer: ReturnType<typeof setTimeout> | null = null;
      const debouncedSearch = () => {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => commit({ page: 1 }), SEARCH_DEBOUNCE_MS);
      };

      const changeRole = async (user: any, role: string) => {
        if (role === user.role) return;
        if (!confirm(`Donner le rôle « ${ROLE_LABELS[role] || role} » à ${user.username} ?`)) {
          await load();
          return;
        }

        try {
          await adminService.updateUserRole(user._id, role as any);
          func.showToastSuccess('Rôle modifié');
          await load();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Le changement de rôle a échoué'));
          await load();
        }
      };

      const reactivate = async (user: any) => {
        try {
          await adminService.updateUserStatus(user._id, 'active');
          func.showToastSuccess(`${user.username} a été réactivé`);
          await load();
          emit('changed');
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La réactivation a échoué'));
        }
      };

      const onSuspended = async () => {
        userToSuspend.value = null;
        await load();
        emit('changed');
      };

      const onSuspendFromDetail = (user: any) => {
        detailUserId.value = null;
        userToSuspend.value = user;
      };

      const onReactivateFromDetail = async (user: any) => {
        detailUserId.value = null;
        await reactivate(user);
      };

      const exportCsv = async () => {
        exporting.value = true;
        try {
          await adminService.exportUsersCsv({
            search: state.search.trim() || undefined,
            role: state.role || undefined,
            status: state.status || undefined
          });
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'L\'export a échoué'));
        } finally {
          exporting.value = false;
        }
      };

      onMounted(load);

      return {
        ACCOUNT_STATUS_LABELS,
        ROLE_LABELS,
        state,
        commit,
        users,
        pagination,
        loading,
        exporting,
        userToSuspend,
        detailUserId,
        statusBadgeClass,
        avatarUrl,
        onAvatarError,
        formatDate,
        getInitial,
        load,
        debouncedSearch,
        changeRole,
        reactivate,
        onSuspended,
        onSuspendFromDetail,
        onReactivateFromDetail,
        exportCsv
      };
    }
  });
</script>
