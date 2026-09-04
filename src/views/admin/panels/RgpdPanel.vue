<template>
  <div class="admin__panel">
    <div class="admin__panel-header">
      <h2>Demandes et droits des personnes</h2>
      <button type="button" class="admin__btn" :disabled="loading" @click="load">
        <i class="bi bi-arrow-clockwise"></i> Actualiser
      </button>
    </div>

    <div class="admin__panel-body">
      <div class="admin__panel-grid">
        <div class="admin__card">
          <h3><i class="bi bi-download"></i> Export des données (Art. 15)</h3>
          <p>Rassemble l'ensemble des données personnelles d'un compte dans un fichier JSON.</p>
          <div class="admin__toolbar">
            <input
              v-model="exportSearch"
              type="search"
              class="admin__input admin__input--search"
              placeholder="Pseudo ou email exact…"
            />
            <button
              type="button"
              class="admin__btn admin__btn--primary"
              :disabled="!exportSearch.trim() || exporting"
              @click="exportUserData"
            >
              <i class="bi bi-file-earmark-zip"></i> Exporter
            </button>
          </div>
        </div>

        <div class="admin__card">
          <h3><i class="bi bi-incognito"></i> Anonymisation (Art. 17)</h3>
          <p>
            Efface les données identifiantes en conservant l'historique des transactions,
            nécessaire à la comptabilité. Irréversible.
          </p>
          <div class="admin__toolbar">
            <input
              v-model="anonymizeSearch"
              type="search"
              class="admin__input admin__input--search"
              placeholder="Pseudo ou email exact…"
            />
            <button
              type="button"
              class="admin__btn admin__btn--danger"
              :disabled="!anonymizeSearch.trim() || anonymizing"
              @click="anonymize"
            >
              <i class="bi bi-person-slash"></i> Anonymiser
            </button>
          </div>
        </div>

        <div class="admin__card">
          <h3><i class="bi bi-shield-check"></i> Consentements</h3>
          <dl class="admin__definition-list">
            <div class="admin__definition">
              <dt>Politique de confidentialité acceptée</dt>
              <dd>{{ stats.privacyAccepted }}</dd>
            </div>
            <div class="admin__definition">
              <dt>Traitement des données</dt>
              <dd>{{ stats.dataProcessing }}</dd>
            </div>
            <div class="admin__definition">
              <dt>Communications marketing</dt>
              <dd>{{ stats.marketing }}</dd>
            </div>
          </dl>
        </div>

        <div class="admin__card">
          <h3><i class="bi bi-clock-history"></i> Suppressions planifiées</h3>
          <p v-if="deletionRequests.length === 0" class="admin__muted" style="margin: 0">
            Aucune demande en attente.
          </p>
          <dl v-else class="admin__definition-list">
            <div v-for="request in deletionRequests" :key="request._id" class="admin__definition">
              <dt>
                <strong>{{ request.username }}</strong>
                <span class="admin__muted"> — échéance {{ formatDate(request.scheduledDeletionDate) }}</span>
              </dt>
              <dd>
                <div class="admin__actions">
                  <button
                    type="button"
                    class="admin__icon-btn admin__icon-btn--danger"
                    title="Exécuter la suppression maintenant"
                    @click="confirmDeletion(request)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                  <button
                    type="button"
                    class="admin__icon-btn admin__icon-btn--success"
                    title="Annuler la demande"
                    @click="cancelDeletion(request)"
                  >
                    <i class="bi bi-arrow-counterclockwise"></i>
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue';
  import adminService from '@/services/admin.service';
  import { func } from '@/function';
  import { apiErrorMessage, formatDate } from '../adminFormat';

  export default defineComponent({
    name: 'RgpdPanel',
    emits: ['changed'],
    setup(_props, { emit }) {
      const deletionRequests = ref<any[]>([]);
      const stats = ref({ privacyAccepted: 0, dataProcessing: 0, marketing: 0 });
      const exportSearch = ref('');
      const anonymizeSearch = ref('');
      const loading = ref(false);
      const exporting = ref(false);
      const anonymizing = ref(false);

      const load = async () => {
        loading.value = true;
        try {
          const [deletions, consents] = await Promise.all([
            adminService.getDeletionRequests(),
            adminService.getRgpdStats()
          ]);
          deletionRequests.value = deletions.users || [];
          stats.value = consents;
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger les données RGPD'));
        } finally {
          loading.value = false;
        }
      };

      const refresh = async () => {
        await load();
        emit('changed');
      };

      const exportUserData = async () => {
        const term = exportSearch.value.trim();
        if (!term) return;

        exporting.value = true;
        try {
          const data = await adminService.exportUserData(term);
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `donnees-${term}.json`;
          link.click();
          URL.revokeObjectURL(url);
          func.showToastSuccess('Export généré');
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Utilisateur introuvable'));
        } finally {
          exporting.value = false;
        }
      };

      const anonymize = async () => {
        const term = anonymizeSearch.value.trim();
        if (!term) return;
        if (!confirm(`Anonymiser définitivement « ${term} » ? Cette action est irréversible.`)) return;

        anonymizing.value = true;
        try {
          await adminService.anonymizeUser(term);
          func.showToastSuccess('Utilisateur anonymisé');
          anonymizeSearch.value = '';
          await refresh();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'L\'anonymisation a échoué'));
        } finally {
          anonymizing.value = false;
        }
      };

      const confirmDeletion = async (request: any) => {
        if (!confirm(`Supprimer définitivement le compte de ${request.username} ? Cette action est irréversible.`)) {
          return;
        }

        try {
          await adminService.confirmDeletion(request._id);
          func.showToastSuccess('Compte supprimé');
          await refresh();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La suppression a échoué'));
        }
      };

      const cancelDeletion = async (request: any) => {
        try {
          await adminService.cancelDeletion(request._id);
          func.showToastSuccess('Demande annulée');
          await refresh();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'L\'annulation a échoué'));
        }
      };

      onMounted(load);

      return {
        deletionRequests,
        stats,
        exportSearch,
        anonymizeSearch,
        loading,
        exporting,
        anonymizing,
        formatDate,
        load,
        exportUserData,
        anonymize,
        confirmDeletion,
        cancelDeletion
      };
    }
  });
</script>
