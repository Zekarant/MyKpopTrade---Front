<template>
  <div class="admin__panel">
    <div class="admin__panel-header">
      <select v-model="state.status" class="admin__select" @change="commit({ page: 1 })">
        <option value="opened">Ouverts</option>
        <option value="under_review">En arbitrage</option>
        <option value="">Tous</option>
        <option value="resolved">Résolus (vendeur)</option>
        <option value="refunded">Remboursés</option>
        <option value="rejected">Rejetés</option>
        <option value="cancelled">Annulés</option>
      </select>
      <button type="button" class="admin__btn" :disabled="loading" @click="load">
        <i class="bi bi-arrow-clockwise"></i> Actualiser
      </button>
    </div>

    <div v-if="disputes.length === 0" class="admin__empty">
      <i class="bi bi-shield-check"></i>
      <p>{{ loading ? 'Chargement…' : 'Aucun litige pour ce filtre.' }}</p>
    </div>

    <div v-else class="admin__table-wrapper">
      <table class="admin__table">
        <thead>
          <tr>
            <th>Acheteur</th>
            <th>Vendeur</th>
            <th>Motif</th>
            <th>Statut</th>
            <th>Ouvert</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dispute in disputes" :key="dispute._id">
            <td>{{ dispute.buyer?.username || '—' }}</td>
            <td>{{ dispute.seller?.username || '—' }}</td>
            <td>{{ DISPUTE_REASON_LABELS[dispute.reason] || dispute.reason }}</td>
            <td>
              <span class="admin__badge" :class="statusBadgeClass(dispute.status)">
                {{ DISPUTE_STATUS_LABELS[dispute.status] || dispute.status }}
              </span>
            </td>
            <td class="admin__cell-nowrap admin__muted">
              {{ formatDate(dispute.createdAt) }}
              <template v-if="isPending(dispute)"> · {{ formatAge(dispute.createdAt) }}</template>
            </td>
            <td class="admin__cell-nowrap">
              <div class="admin__actions">
                <button
                  v-if="dispute.status === 'opened'"
                  type="button"
                  class="admin__btn"
                  @click="take(dispute)"
                >
                  <i class="bi bi-hand-index"></i> Prendre
                </button>
                <button
                  v-if="isPending(dispute)"
                  type="button"
                  class="admin__btn admin__btn--primary"
                  @click="openResolution(dispute)"
                >
                  <i class="bi bi-hammer"></i> Trancher
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

    <div v-if="activeDispute" class="admin__modal-overlay" @click.self="activeDispute = null">
      <div class="admin__modal" role="dialog" aria-modal="true">
        <div class="admin__modal-header">
          <h3>Trancher le litige</h3>
          <button type="button" class="admin__icon-btn" aria-label="Fermer" @click="activeDispute = null">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="admin__modal-body">
          <div class="admin__card" style="margin-bottom: var(--space-md)">
            <h3><i class="bi bi-info-circle"></i> {{ DISPUTE_REASON_LABELS[activeDispute.reason] || activeDispute.reason }}</h3>
            <p style="margin: 0">{{ activeDispute.description }}</p>
          </div>

          <div class="admin__field">
            <label for="dispute-outcome">Décision</label>
            <select id="dispute-outcome" v-model="resolution.outcome" class="admin__select">
              <option value="resolved">Résolu en faveur du vendeur</option>
              <option value="refunded">Rembourser l'acheteur</option>
              <option value="rejected">Rejeter le litige</option>
            </select>
          </div>

          <div v-if="resolution.outcome === 'refunded'" class="admin__field">
            <label for="dispute-amount">Montant à rembourser</label>
            <input
              id="dispute-amount"
              v-model.number="resolution.refundAmount"
              type="number"
              min="0.01"
              step="0.01"
              class="admin__input"
              placeholder="Laisser vide pour rembourser le total"
            />
          </div>

          <div class="admin__field">
            <label for="dispute-notes">Notes (visibles par les deux parties)</label>
            <textarea
              id="dispute-notes"
              v-model="resolution.notes"
              class="admin__textarea"
              rows="4"
              maxlength="2000"
              placeholder="Justification de la décision"
            ></textarea>
          </div>
        </div>

        <div class="admin__modal-footer">
          <button type="button" class="admin__btn admin__btn--ghost" @click="activeDispute = null">Annuler</button>
          <button type="button" class="admin__btn admin__btn--primary" :disabled="submitting" @click="submitResolution">
            {{ submitting ? 'Enregistrement…' : 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue';
  import disputeService from '@/services/dispute.service';
  import { func } from '@/function';
  import { useAdminQueryState } from '../useAdminQueryState';
  import {
    DISPUTE_REASON_LABELS,
    DISPUTE_STATUS_LABELS,
    apiErrorMessage,
    formatAge,
    formatDate
  } from '../adminFormat';

  const PAGE_SIZE = 20;
  const PENDING_STATUSES = ['opened', 'under_review'];

  export default defineComponent({
    name: 'DisputesPanel',
    emits: ['changed'],
    setup(_props, { emit }) {
      const disputes = ref<any[]>([]);
      const pagination = ref({ totalPages: 1 });
      const loading = ref(false);
      const submitting = ref(false);
      const activeDispute = ref<any>(null);
      const resolution = ref<{
        outcome: 'resolved' | 'refunded' | 'rejected';
        notes: string;
        refundAmount: number | undefined;
      }>({ outcome: 'resolved', notes: '', refundAmount: undefined });

      const { state, commit } = useAdminQueryState({ status: 'opened', page: 1 }, () => load());

      const isPending = (dispute: any) => PENDING_STATUSES.includes(dispute.status);

      const statusBadgeClass = (status: string) =>
        ({
          opened: 'admin__badge--danger',
          under_review: 'admin__badge--warning',
          resolved: 'admin__badge--success',
          refunded: 'admin__badge--info'
        })[status] || 'admin__badge';

      const load = async () => {
        loading.value = true;
        try {
          const data = await disputeService.adminList({
            status: (state.status || undefined) as any,
            page: state.page,
            limit: PAGE_SIZE
          });
          disputes.value = data.disputes || [];
          pagination.value = data.pagination || { totalPages: 1 };
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger les litiges'));
          disputes.value = [];
        } finally {
          loading.value = false;
        }
      };

      const take = async (dispute: any) => {
        try {
          await disputeService.adminTake(dispute._id);
          func.showToastSuccess('Litige pris en arbitrage');
          await load();
          emit('changed');
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La prise en charge a échoué'));
        }
      };

      const openResolution = (dispute: any) => {
        activeDispute.value = dispute;
        resolution.value = { outcome: 'resolved', notes: '', refundAmount: undefined };
      };

      const submitResolution = async () => {
        if (!activeDispute.value || submitting.value) return;

        const payload: Record<string, unknown> = {
          outcome: resolution.value.outcome,
          notes: resolution.value.notes.trim() || undefined
        };
        if (resolution.value.outcome === 'refunded' && resolution.value.refundAmount) {
          payload.refundAmount = Number(resolution.value.refundAmount);
        }

        submitting.value = true;
        try {
          await disputeService.adminResolve(activeDispute.value._id, payload as any);
          func.showToastSuccess('Litige clôturé');
          activeDispute.value = null;
          await load();
          emit('changed');
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La clôture a échoué'));
        } finally {
          submitting.value = false;
        }
      };

      onMounted(load);

      return {
        DISPUTE_REASON_LABELS,
        DISPUTE_STATUS_LABELS,
        state,
        commit,
        disputes,
        pagination,
        loading,
        submitting,
        activeDispute,
        resolution,
        isPending,
        statusBadgeClass,
        formatAge,
        formatDate,
        load,
        take,
        openResolution,
        submitResolution
      };
    }
  });
</script>
