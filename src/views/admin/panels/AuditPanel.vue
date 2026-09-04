<template>
  <div style="display: flex; flex-direction: column; gap: var(--space-md)">
    <div class="admin__kpis">
      <div class="admin__kpi">
        <i class="bi bi-lightning-charge"></i>
        <span class="admin__kpi-body">
          <span class="admin__kpi-value">{{ stats.todayActions }}</span>
          <span class="admin__kpi-label">Actions aujourd'hui</span>
        </span>
      </div>
      <div class="admin__kpi admin__kpi--info">
        <i class="bi bi-calendar-week"></i>
        <span class="admin__kpi-body">
          <span class="admin__kpi-value">{{ stats.weekActions }}</span>
          <span class="admin__kpi-label">Cette semaine</span>
        </span>
      </div>
    </div>

    <div class="admin__panel">
      <div class="admin__panel-header">
        <select v-model="state.targetType" class="admin__select" @change="commit({ page: 1 })">
          <option value="">Toutes les cibles</option>
          <option v-for="(label, value) in TARGET_TYPE_LABELS" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>

      <div v-if="logs.length === 0" class="admin__empty">
        <i class="bi bi-journal-text"></i>
        <p>{{ loading ? 'Chargement…' : 'Aucune action enregistrée.' }}</p>
      </div>

      <div v-else class="admin__table-wrapper">
        <table class="admin__table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Action</th>
              <th>Cible</th>
              <th>Détails</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log._id">
              <td>
                <div class="admin__user-cell">
                  <span class="admin__avatar-letter">{{ getInitial(log.admin?.username) }}</span>
                  {{ log.admin?.username || 'Système' }}
                </div>
              </td>
              <td><span class="admin__badge">{{ log.action }}</span></td>
              <td>
                <span class="admin__badge admin__badge--info">
                  {{ TARGET_TYPE_LABELS[log.targetType] || log.targetType }}
                </span>
              </td>
              <td><span class="admin__excerpt" :title="log.details">{{ log.details || '—' }}</span></td>
              <td class="admin__cell-nowrap admin__muted">{{ formatDateTime(log.createdAt) }}</td>
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
  </div>
</template>

<script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue';
  import adminService from '@/services/admin.service';
  import { func } from '@/function';
  import { useAdminQueryState } from '../useAdminQueryState';
  import { apiErrorMessage, formatDateTime, getInitial } from '../adminFormat';

  const TARGET_TYPE_LABELS: Record<string, string> = {
    user: 'Utilisateur',
    product: 'Produit',
    post: 'Post',
    report: 'Signalement',
    verification: 'Vérification',
    dispute: 'Litige',
    payment: 'Paiement',
    system: 'Système'
  };

  export default defineComponent({
    name: 'AuditPanel',
    setup() {
      const logs = ref<any[]>([]);
      const stats = ref({ todayActions: 0, weekActions: 0 });
      const pagination = ref({ totalPages: 1 });
      const loading = ref(false);

      const { state, commit } = useAdminQueryState({ targetType: '', page: 1 }, () => load());

      const load = async () => {
        loading.value = true;
        try {
          const [logsData, statsData] = await Promise.all([
            adminService.getAuditLogs({
              page: state.page,
              targetType: state.targetType || undefined
            }),
            adminService.getAuditStats()
          ]);
          logs.value = logsData.logs || [];
          pagination.value = logsData.pagination || { totalPages: 1 };
          stats.value = statsData;
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger le journal'));
          logs.value = [];
        } finally {
          loading.value = false;
        }
      };

      onMounted(load);

      return {
        TARGET_TYPE_LABELS,
        state,
        commit,
        logs,
        stats,
        pagination,
        loading,
        formatDateTime,
        getInitial
      };
    }
  });
</script>
