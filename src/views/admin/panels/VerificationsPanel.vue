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
                  class="admin__icon-btn"
                  title="Voir le document"
                  :disabled="documentLoadingId === verification._id"
                  @click="viewDocument(verification)"
                >
                  <i class="bi bi-eye"></i>
                </button>
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

    <div v-if="documentUrl" class="admin__modal-overlay" @click.self="closeDocument">
      <div class="admin__modal" role="dialog" aria-modal="true" aria-labelledby="verification-doc-title">
        <div class="admin__modal-header">
          <h3 id="verification-doc-title">Document de {{ documentOwner }}</h3>
          <button type="button" class="admin__icon-btn" aria-label="Fermer" @click="closeDocument">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <img :src="documentUrl" alt="Document d'identité soumis" class="verification-doc__image" />
        <p class="admin__muted">
          Consultation enregistrée dans le journal d'audit. Le document est supprimé dès la décision.
        </p>
      </div>
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
  import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';
  import adminService from '@/services/admin.service';
  import { func } from '@/function';
  import ReasonPromptModal from '../components/ReasonPromptModal.vue';
  import { VERIFICATION_REJECTION_REASONS } from '../adminPresets';
  import { apiErrorMessage, formatAge, formatDate, getInitial } from '../adminFormat';
  import type { AdminVerification } from '../types';

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
      const verifications = ref<AdminVerification[]>([]);
      const loading = ref(false);
      const verificationToReject = ref<AdminVerification | null>(null);
      // URL objet en mémoire uniquement : la pièce d'identité n'est jamais mise
      // en cache ni écrite sur le disque du navigateur.
      const documentUrl = ref<string | null>(null);
      const documentOwner = ref('');
      const documentLoadingId = ref<string | null>(null);

      const closeDocument = () => {
        if (documentUrl.value) URL.revokeObjectURL(documentUrl.value);
        documentUrl.value = null;
      };

      const viewDocument = async (verification: AdminVerification) => {
        documentLoadingId.value = verification._id;
        try {
          const blob = await adminService.getVerificationDocument(verification._id);
          closeDocument();
          documentUrl.value = URL.createObjectURL(blob);
          documentOwner.value = verification.user?.username || 'Compte supprimé';
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible d\'afficher le document'));
        } finally {
          documentLoadingId.value = null;
        }
      };

      onBeforeUnmount(closeDocument);

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

      const approve = async (verification: AdminVerification) => {
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
        documentUrl,
        documentOwner,
        documentLoadingId,
        viewDocument,
        closeDocument,
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

<style scoped>
  .verification-doc__image {
    display: block;
    max-width: 100%;
    max-height: 70vh;
    margin: 0 auto;
    object-fit: contain;
  }
</style>
