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
        <select v-model="state.targetType" aria-label="Filtrer par cible" class="admin__select" @change="commit({ page: 1 })">
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

      <AdminPagination :page="state.page" :pages="pagination.pages" @change="(p) => commit({ page: p })" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AdminPagination from '../components/AdminPagination.vue';
import adminService from '@/services/admin.service';
import { func } from '@/function';
import { useAdminQueryState } from '../useAdminQueryState';
import { apiErrorMessage, formatDateTime, getInitial } from '../adminFormat';
import type { AdminAuditLog } from '../types';

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

const logs = ref<AdminAuditLog[]>([]);
const stats = ref({ todayActions: 0, weekActions: 0 });
const pagination = ref({ pages: 1 });
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
    pagination.value = logsData.pagination || { pages: 1 };
    stats.value = statsData;
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'Impossible de charger le journal'));
    logs.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>
