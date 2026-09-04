<template>
  <div class="admin__panel">
    <div class="admin__panel-header">
      <h2>{{ verifications.length }} demande{{ verifications.length > 1 ? 's' : '' }} en attente</h2>
      <button type="button" class="admin__btn" :disabled="loading" @click="load">
        <i class="bi bi-arrow-clockwise"></i> Actualiser
      </button>
    </div>

    <div v-if="verifications.length === 0" class="admin__empty">
      <i class="bi bi-patch-check"></i>
      <p>{{ loading ? 'Chargement…' : 'Aucune vérification en attente.' }}</p>
    </div>

    <div v-else class="admin__table-wrapper">
      <table class="admin__table">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Document</th>
            <th>Soumis</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="verification in verifications" :key="verification._id">
            <td>
              <div class="admin__user-cell">
                <span class="admin__avatar-letter">{{ getInitial(verification.user?.username) }}</span>
                {{ verification.user?.username || 'Compte supprimé' }}
              </div>
            </td>
            <td>
              <span class="admin__badge admin__badge--info">
                {{ DOCUMENT_TYPE_LABELS[verification.documentType] || verification.documentType || 'Identité' }}
              </span>
            </td>
            <td class="admin__cell-nowrap admin__muted">
              {{ formatDate(verification.submittedAt || verification.createdAt) }}
              · {{ formatAge(verification.submittedAt || verification.createdAt) }}
            </td>
            <td class="admin__cell-nowrap">
              <div class="admin__actions">
                <button
                  type="button"
                  class="admin__icon-btn admin__icon-btn--success"
                  title="Approuver"
                  @click="approve(verification)"
                >
                  <i class="bi bi-check-lg"></i>
                </button>
                <button
                  type="button"
                  class="admin__icon-btn admin__icon-btn--danger"
                  title="Rejeter"
                  @click="verificationToReject = verification"
                >
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ReasonPromptModal
      v-if="verificationToReject"
      :title="`Rejeter la vérification de ${verificationToReject.user?.username || 'ce membre'}`"
      description="Le motif est envoyé à l'utilisateur par email : il doit lui permettre de corriger et de soumettre à nouveau."
      :presets="VERIFICATION_REJECTION_REASONS"
      confirm-label="Rejeter la demande"
      confirm-icon="bi bi-x-lg"
      destructive
      required
      @cancel="verificationToReject = null"
      @confirm="reject"
    />
  </div>
</template>

<script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue';
  import adminService from '@/services/admin.service';
  import { func } from '@/function';
  import ReasonPromptModal from '../components/ReasonPromptModal.vue';
  import { VERIFICATION_REJECTION_REASONS } from '../adminPresets';
  import { apiErrorMessage, formatAge, formatDate, getInitial } from '../adminFormat';

  const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    id_card: 'Carte d\'identité',
    passport: 'Passeport',
    driver_license: 'Permis de conduire'
  };

  export default defineComponent({
    name: 'VerificationsPanel',
    components: { ReasonPromptModal },
    emits: ['changed'],
    setup(_props, { emit }) {
      const verifications = ref<any[]>([]);
      const loading = ref(false);
      const verificationToReject = ref<any>(null);

      const load = async () => {
        loading.value = true;
        try {
          const data = await adminService.getPendingVerifications();
          verifications.value = data.verifications || data || [];
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger les vérifications'));
          verifications.value = [];
        } finally {
          loading.value = false;
        }
      };

      const refresh = async () => {
        await load();
        emit('changed');
      };

      const approve = async (verification: any) => {
        try {
          await adminService.approveVerification(verification._id);
          func.showToastSuccess('Vérification approuvée');
          await refresh();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'L\'approbation a échoué'));
        }
      };

      const reject = async (reason: string) => {
        const verification = verificationToReject.value;
        if (!verification) return;

        try {
          await adminService.rejectVerification(verification._id, reason);
          func.showToastSuccess('Vérification rejetée');
          verificationToReject.value = null;
          await refresh();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Le rejet a échoué'));
        }
      };

      onMounted(load);

      return {
        DOCUMENT_TYPE_LABELS,
        VERIFICATION_REJECTION_REASONS,
        verifications,
        loading,
        verificationToReject,
        formatAge,
        formatDate,
        getInitial,
        load,
        approve,
        reject
      };
    }
  });
</script>
