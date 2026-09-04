<template>
  <div class="admin__panel">
    <div class="admin__panel-header">
      <div class="admin__toolbar">
        <select v-model="state.status" class="admin__select" @change="commit({ page: 1 })">
          <option value="pending">En attente</option>
          <option value="reviewed">Examinés</option>
          <option value="resolved">Résolus</option>
          <option value="rejected">Rejetés</option>
          <option value="">Tous les statuts</option>
        </select>
        <select v-model="state.targetType" class="admin__select" @change="commit({ page: 1 })">
          <option value="">Toutes les cibles</option>
          <option v-for="(label, value) in REPORT_TARGET_LABELS" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
      <div class="admin__toolbar">
        <button type="button" class="admin__btn" :disabled="exporting" @click="exportCsv">
          <i class="bi bi-filetype-csv"></i> Exporter
        </button>
        <button type="button" class="admin__icon-btn" title="Actualiser" :disabled="loading" @click="load">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>

    <div v-if="selectedIds.length" class="admin__bulk-bar">
      <span><strong>{{ selectedIds.length }}</strong> signalement(s) sélectionné(s)</span>
      <div class="admin__toolbar">
        <button type="button" class="admin__btn admin__btn--ghost" @click="clearSelection">Désélectionner</button>
        <button type="button" class="admin__btn" @click="bulkTarget = 'rejected'">
          <i class="bi bi-x-lg"></i> Rejeter le lot
        </button>
        <button type="button" class="admin__btn admin__btn--primary" @click="bulkTarget = 'resolved'">
          <i class="bi bi-check-lg"></i> Résoudre le lot
        </button>
      </div>
    </div>

    <div v-if="reports.length === 0" class="admin__empty">
      <i class="bi bi-check2-circle"></i>
      <p>{{ loading ? 'Chargement…' : 'Aucun signalement pour ce filtre.' }}</p>
    </div>

    <div v-else class="admin__table-wrapper">
      <table class="admin__table admin__table--clickable">
        <thead>
          <tr>
            <th class="admin__cell-select">
              <input
                type="checkbox"
                class="admin__checkbox"
                aria-label="Tout sélectionner"
                :checked="allSelected"
                @change="toggleAll"
              />
            </th>
            <th>Signaleur</th>
            <th>Cible</th>
            <th>Motif</th>
            <th>Statut</th>
            <th>Reçu</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in reports" :key="report._id" @click="openDetail(report._id)">
            <td class="admin__cell-select" @click.stop>
              <input
                type="checkbox"
                class="admin__checkbox"
                :aria-label="`Sélectionner le signalement de ${report.reporter?.username || 'un membre'}`"
                :checked="selection.has(report._id)"
                @change="toggle(report._id)"
              />
            </td>
            <td>
              <span class="admin__user-cell">
                <span class="admin__avatar-letter">{{ getInitial(report.reporter?.username) }}</span>
                {{ report.reporter?.username || 'Compte supprimé' }}
              </span>
            </td>
            <td>
              <span class="admin__badge admin__badge--accent">
                {{ REPORT_TARGET_LABELS[report.targetType] || report.targetType }}
              </span>
            </td>
            <td>{{ REPORT_REASON_LABELS[report.reason] || report.reason }}</td>
            <td>
              <span class="admin__badge" :class="statusBadgeClass(report.status)">
                {{ REPORT_STATUS_LABELS[report.status] || report.status }}
              </span>
            </td>
            <td class="admin__cell-nowrap admin__muted">
              {{ formatDate(report.createdAt) }}
              <template v-if="report.status === 'pending'"> · {{ formatAge(report.createdAt) }}</template>
            </td>
            <td class="admin__cell-nowrap">
              <div class="admin__actions" @click.stop>
                <button
                  type="button"
                  class="admin__icon-btn"
                  title="Examiner le signalement"
                  @click="openDetail(report._id)"
                >
                  <i class="bi bi-eye"></i>
                </button>
                <button
                  v-if="report.status === 'pending'"
                  type="button"
                  class="admin__icon-btn admin__icon-btn--success"
                  title="Marquer résolu"
                  @click="quickResolve(report._id, 'resolved')"
                >
                  <i class="bi bi-check-lg"></i>
                </button>
                <button
                  v-if="report.status === 'pending'"
                  type="button"
                  class="admin__icon-btn admin__icon-btn--danger"
                  title="Rejeter"
                  @click="quickResolve(report._id, 'rejected')"
                >
                  <i class="bi bi-x-lg"></i>
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
      <span>{{ state.page }} / {{ pagination.totalPages }} — {{ pagination.totalItems }} signalements</span>
      <button
        type="button"
        class="admin__icon-btn"
        :disabled="state.page >= pagination.totalPages"
        @click="commit({ page: state.page + 1 })"
      >
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>

    <ReportDetailModal
      v-if="detailReportId"
      :report-id="detailReportId"
      @close="detailReportId = null"
      @resolved="onDetailResolved"
      @suspend="onSuspendRequest"
    />

    <SuspendUserModal
      v-if="userToSuspend"
      :user="userToSuspend"
      @close="userToSuspend = null"
      @confirmed="onSuspendConfirmed"
    />

    <ReasonPromptModal
      v-if="bulkTarget"
      :title="`${bulkTarget === 'resolved' ? 'Résoudre' : 'Rejeter'} ${selectedIds.length} signalement(s)`"
      description="La note est enregistrée sur chacun des signalements du lot."
      :presets="REPORT_RESOLUTION_NOTES"
      :confirm-label="bulkTarget === 'resolved' ? 'Résoudre le lot' : 'Rejeter le lot'"
      :destructive="bulkTarget === 'rejected'"
      placeholder="Note interne appliquée au lot (facultatif)"
      @cancel="bulkTarget = null"
      @confirm="applyBulk"
    />
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onMounted, ref } from 'vue';
  import adminService from '@/services/admin.service';
  import { func } from '@/function';
  import ReasonPromptModal from '../components/ReasonPromptModal.vue';
  import ReportDetailModal from '../components/ReportDetailModal.vue';
  import SuspendUserModal from '../components/SuspendUserModal.vue';
  import { REPORT_RESOLUTION_NOTES } from '../adminPresets';
  import { useAdminQueryState } from '../useAdminQueryState';
  import {
    REPORT_REASON_LABELS,
    REPORT_STATUS_LABELS,
    REPORT_TARGET_LABELS,
    apiErrorMessage,
    formatAge,
    formatDate,
    getInitial
  } from '../adminFormat';

  const PAGE_SIZE = 50;

  export default defineComponent({
    name: 'ReportsPanel',
    components: { ReasonPromptModal, ReportDetailModal, SuspendUserModal },
    emits: ['changed'],
    setup(_props, { emit }) {
      const reports = ref<any[]>([]);
      const pagination = ref({ totalPages: 1, totalItems: 0 });
      const loading = ref(false);
      const exporting = ref(false);
      const detailReportId = ref<string | null>(null);
      const userToSuspend = ref<{ _id: string; username: string } | null>(null);
      const bulkTarget = ref<'resolved' | 'rejected' | null>(null);
      const selection = ref<Set<string>>(new Set());

      const { state, commit } = useAdminQueryState(
        { status: 'pending', targetType: '', page: 1 },
        () => load()
      );

      const selectedIds = computed(() => [...selection.value]);
      const allSelected = computed(
        () => reports.value.length > 0 && reports.value.every((report) => selection.value.has(report._id))
      );

      const statusBadgeClass = (status: string) =>
        ({
          pending: 'admin__badge--warning',
          reviewed: 'admin__badge--info',
          resolved: 'admin__badge--success',
          rejected: 'admin__badge'
        })[status] || 'admin__badge';

      const clearSelection = () => {
        selection.value = new Set();
      };

      const toggle = (reportId: string) => {
        const next = new Set(selection.value);
        if (next.has(reportId)) next.delete(reportId);
        else next.add(reportId);
        selection.value = next;
      };

      const toggleAll = () => {
        selection.value = allSelected.value
          ? new Set()
          : new Set(reports.value.map((report) => report._id));
      };

      const load = async () => {
        loading.value = true;
        try {
          const data = await adminService.getReports({
            status: state.status || undefined,
            targetType: state.targetType || undefined,
            page: state.page,
            limit: PAGE_SIZE
          });
          reports.value = data.reports || [];
          pagination.value = data.pagination || { totalPages: 1, totalItems: 0 };
          const visible = new Set(reports.value.map((report) => report._id));
          selection.value = new Set(selectedIds.value.filter((id) => visible.has(id)));
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger les signalements'));
          reports.value = [];
        } finally {
          loading.value = false;
        }
      };

      const refresh = async () => {
        await load();
        emit('changed');
      };

      const openDetail = (reportId: string) => {
        detailReportId.value = reportId;
      };

      const onDetailResolved = async () => {
        detailReportId.value = null;
        await refresh();
      };

      const onSuspendRequest = (owner: any) => {
        userToSuspend.value = { _id: owner._id, username: owner.username };
      };

      const onSuspendConfirmed = () => {
        userToSuspend.value = null;
        emit('changed');
      };

      const quickResolve = async (reportId: string, status: 'resolved' | 'rejected') => {
        try {
          await adminService.updateReportStatus(reportId, status);
          func.showToastSuccess(status === 'resolved' ? 'Signalement résolu' : 'Signalement rejeté');
          await refresh();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Erreur lors de la mise à jour'));
        }
      };

      const applyBulk = async (note: string) => {
        const status = bulkTarget.value;
        const ids = selectedIds.value;
        if (!status || ids.length === 0) return;

        try {
          const data = await adminService.bulkUpdateReports(ids, status, note || undefined);
          func.showToastSuccess(data.message || `${ids.length} signalement(s) traité(s)`);
          bulkTarget.value = null;
          clearSelection();
          await refresh();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Le traitement groupé a échoué'));
        }
      };

      const exportCsv = async () => {
        exporting.value = true;
        try {
          await adminService.exportReportsCsv({
            status: state.status || undefined,
            targetType: state.targetType || undefined
          });
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'L\'export a échoué'));
        } finally {
          exporting.value = false;
        }
      };

      onMounted(load);

      return {
        REPORT_REASON_LABELS,
        REPORT_STATUS_LABELS,
        REPORT_TARGET_LABELS,
        REPORT_RESOLUTION_NOTES,
        state,
        commit,
        reports,
        pagination,
        loading,
        exporting,
        detailReportId,
        userToSuspend,
        bulkTarget,
        selection,
        selectedIds,
        allSelected,
        statusBadgeClass,
        clearSelection,
        toggle,
        toggleAll,
        formatAge,
        formatDate,
        getInitial,
        load,
        openDetail,
        onDetailResolved,
        onSuspendRequest,
        onSuspendConfirmed,
        quickResolve,
        applyBulk,
        exportCsv
      };
    }
  });
</script>
