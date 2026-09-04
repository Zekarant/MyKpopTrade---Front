<template>
  <div class="admin__modal-overlay" @click.self="$emit('close')">
    <div class="admin__modal admin__modal--wide" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div class="admin__modal-header">
        <h3 id="report-title">
          Signalement — {{ detail?.reasonLabel || '…' }}
        </h3>
        <button type="button" class="admin__icon-btn" aria-label="Fermer" @click="$emit('close')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="admin__modal-body">
        <div v-if="loading" class="admin__empty admin__empty--inline">
          <i class="bi bi-hourglass-split"></i>
          <p>Chargement du signalement…</p>
        </div>

        <template v-else-if="detail">
          <div v-if="detail.target" class="admin__report-target">
            <img
              v-if="targetImage"
              :src="targetImage"
              class="admin__report-target-image"
              alt=""
              @error="targetImageFailed = true"
            />
            <div v-else class="admin__report-target-image admin__thumb--placeholder">
              <i class="bi bi-image"></i>
            </div>

            <div class="admin__report-target-body">
              <h4>{{ detail.target.label }}</h4>
              <p>{{ detail.target.excerpt || 'Aucun contenu textuel.' }}</p>

              <div class="admin__meta-row">
                <span class="admin__badge admin__badge--accent">
                  {{ REPORT_TARGET_LABELS[detail.target.type] || detail.target.type }}
                </span>
                <span v-if="detail.target.meta?.price !== undefined">
                  {{ formatPrice(detail.target.meta.price, detail.target.meta.currency) }}
                </span>
                <span v-if="detail.target.meta?.rating">
                  <i class="bi bi-star-fill"></i> {{ detail.target.meta.rating }}/5
                </span>
                <span v-if="detail.target.meta?.isReply" class="admin__badge admin__badge--info">Réponse</span>
                <span v-if="detail.target.meta?.likesCount !== undefined">
                  <i class="bi bi-heart"></i> {{ detail.target.meta.likesCount }}
                </span>
                <span v-if="detail.target.meta?.location">
                  <i class="bi bi-geo-alt"></i> {{ detail.target.meta.location }}
                </span>
                <span v-if="detail.target.meta?.isSold" class="admin__badge admin__badge--success">Vendu</span>
                <span v-if="detail.target.meta?.isHidden" class="admin__badge admin__badge--warning">Déjà masqué</span>
                <span v-if="detail.target.meta?.isSuspended" class="admin__badge admin__badge--warning">
                  Compte déjà suspendu
                </span>
                <span class="admin__muted">
                  {{ detail.target.type === 'user' ? 'inscrit' : 'publié' }} le
                  {{ formatDate(detail.target.createdAt) }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="admin__card">
            <h3><i class="bi bi-exclamation-triangle"></i> Contenu introuvable</h3>
            <p>
              La cible de ce signalement a déjà été supprimée. Il ne reste plus qu'à
              clore le signalement.
            </p>
          </div>

          <div class="admin__panel-grid">
            <div v-if="detail.target?.owner" class="admin__card">
              <h3><i class="bi bi-person-badge"></i> Auteur du contenu</h3>
              <div class="admin__user-cell" style="margin-bottom: var(--space-sm)">
                <img
                  v-if="ownerAvatar"
                  :src="ownerAvatar"
                  class="admin__avatar"
                  alt=""
                  @error="ownerAvatarFailed = true"
                />
                <span v-else class="admin__avatar-letter">{{ getInitial(detail.target.owner.username) }}</span>
                <span>{{ detail.target.owner.username }}</span>
                <span class="admin__badge" :class="statusBadgeClass(detail.target.owner.accountStatus)">
                  {{ ACCOUNT_STATUS_LABELS[detail.target.owner.accountStatus] || detail.target.owner.accountStatus }}
                </span>
              </div>
              <dl class="admin__definition-list">
                <div class="admin__definition">
                  <dt>Rôle</dt>
                  <dd>{{ ROLE_LABELS[detail.target.owner.role] || detail.target.owner.role }}</dd>
                </div>
                <div class="admin__definition">
                  <dt>Signalements sur ce contenu</dt>
                  <dd>{{ detail.targetHistory.totalReports }}</dd>
                </div>
              </dl>
            </div>

            <div class="admin__card">
              <h3><i class="bi bi-megaphone"></i> Signaleur</h3>
              <div class="admin__user-cell" style="margin-bottom: var(--space-sm)">
                <span class="admin__avatar-letter">{{ getInitial(detail.report.reporter?.username) }}</span>
                <span>{{ detail.report.reporter?.username || 'Compte supprimé' }}</span>
              </div>
              <dl class="admin__definition-list">
                <div class="admin__definition">
                  <dt>Signalé le</dt>
                  <dd>{{ formatDateTime(detail.report.createdAt) }}</dd>
                </div>
                <div class="admin__definition">
                  <dt>Signalements retenus</dt>
                  <dd>{{ detail.reporterHistory.resolved }} / {{ detail.reporterHistory.total }}</dd>
                </div>
                <div class="admin__definition">
                  <dt>Signalements rejetés</dt>
                  <dd :class="{ 'admin__badge admin__badge--danger': isNoisyReporter }">
                    {{ detail.reporterHistory.rejected }}
                  </dd>
                </div>
              </dl>
              <p v-if="isNoisyReporter" class="admin__hint" style="margin-top: var(--space-sm)">
                La majorité des signalements de ce compte ont été rejetés.
              </p>
            </div>
          </div>

          <div v-if="detail.report.details" class="admin__field" style="margin-top: var(--space-md)">
            <label>Précisions du signaleur</label>
            <p class="admin__muted" style="margin: 0; white-space: pre-wrap">{{ detail.report.details }}</p>
          </div>

          <div class="admin__field" style="margin-top: var(--space-md)">
            <label for="report-notes">Notes internes</label>
            <textarea
              id="report-notes"
              v-model="adminNotes"
              class="admin__textarea"
              rows="3"
              maxlength="500"
              placeholder="Conservées dans le signalement et le journal d'audit"
            ></textarea>
          </div>
        </template>

        <div v-else class="admin__empty admin__empty--inline">
          <i class="bi bi-exclamation-circle"></i>
          <p>Signalement introuvable.</p>
        </div>
      </div>

      <div v-if="detail" class="admin__modal-footer">
        <button
          v-if="detail.target?.owner && detail.target.owner.accountStatus === 'active' && detail.target.owner.role !== 'admin'"
          type="button"
          class="admin__btn"
          @click="$emit('suspend', detail.target.owner)"
        >
          <i class="bi bi-person-x"></i> Suspendre l'auteur
        </button>
        <button
          v-if="deletableTargetLabel"
          type="button"
          class="admin__btn admin__btn--danger"
          :disabled="acting"
          @click="deleteTargetAndResolve"
        >
          <i class="bi bi-trash"></i> Supprimer {{ deletableTargetLabel }}
        </button>
        <button type="button" class="admin__btn admin__btn--ghost" :disabled="acting" @click="resolve('rejected')">
          <i class="bi bi-x-lg"></i> Rejeter
        </button>
        <button type="button" class="admin__btn admin__btn--primary" :disabled="acting" @click="resolve('resolved')">
          <i class="bi bi-check-lg"></i> Marquer résolu
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onMounted, ref } from 'vue';
  import adminService from '@/services/admin.service';
  import { API_URL } from '@/config/api';
  import { func } from '@/function';
  import {
    ACCOUNT_STATUS_LABELS,
    REPORT_TARGET_LABELS,
    ROLE_LABELS,
    apiErrorMessage,
    formatDate,
    formatDateTime,
    formatPrice,
    getInitial
  } from '../adminFormat';

  const NOISY_REPORTER_RATIO = 0.5;
  const NOISY_REPORTER_MIN_REPORTS = 3;

  export default defineComponent({
    name: 'ReportDetailModal',
    props: {
      reportId: { type: String, required: true }
    },
    emits: ['close', 'resolved', 'suspend'],
    setup(props, { emit }) {
      const detail = ref<any>(null);
      const loading = ref(true);
      const acting = ref(false);
      const adminNotes = ref('');
      const targetImageFailed = ref(false);
      const ownerAvatarFailed = ref(false);

      const mediaUrl = (path?: string): string | null => {
        if (!path) return null;
        return path.startsWith('http') ? path : `${API_URL}${path}`;
      };

      const targetImage = computed(() => {
        if (targetImageFailed.value) return null;
        return mediaUrl(detail.value?.target?.images?.[0]);
      });

      const ownerAvatar = computed(() => {
        const picture = detail.value?.target?.owner?.profilePicture;
        if (ownerAvatarFailed.value || !picture || picture.includes('avatar-default')) return null;
        return mediaUrl(picture);
      });

      const deletableTargetLabel = computed(() => {
        const type = detail.value?.target?.type;
        if (type === 'product') return 'le produit';
        if (type === 'post') return 'la publication';
        return null;
      });

      const isNoisyReporter = computed(() => {
        const history = detail.value?.reporterHistory;
        if (!history || history.total < NOISY_REPORTER_MIN_REPORTS) return false;
        return history.rejected / history.total > NOISY_REPORTER_RATIO;
      });

      const statusBadgeClass = (status: string) =>
        status === 'active'
          ? 'admin__badge--success'
          : status === 'suspended'
            ? 'admin__badge--warning'
            : 'admin__badge--danger';

      const load = async () => {
        loading.value = true;
        try {
          detail.value = await adminService.getReportDetail(props.reportId);
          adminNotes.value = detail.value?.report?.adminNotes || '';
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger le signalement'));
          detail.value = null;
        } finally {
          loading.value = false;
        }
      };

      const resolve = async (status: 'resolved' | 'rejected') => {
        if (acting.value) return;

        acting.value = true;
        try {
          await adminService.updateReportStatus(props.reportId, status, adminNotes.value.trim() || undefined);
          func.showToastSuccess(status === 'resolved' ? 'Signalement résolu' : 'Signalement rejeté');
          emit('resolved');
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Erreur lors de la mise à jour'));
        } finally {
          acting.value = false;
        }
      };

      const deleteTargetAndResolve = async () => {
        const target = detail.value?.target;
        if (!target || acting.value) return;
        if (!confirm(`Supprimer définitivement « ${target.label} » ?`)) return;

        const motive = adminNotes.value.trim() || detail.value.reasonLabel;

        acting.value = true;
        try {
          if (target.type === 'product') {
            await adminService.deleteProduct(target.id, motive);
          } else {
            await adminService.adminDeletePost(target.id, motive);
          }
          await adminService.updateReportStatus(
            props.reportId,
            'resolved',
            adminNotes.value.trim() || 'Contenu supprimé suite au signalement'
          );
          func.showToastSuccess('Contenu supprimé et signalement résolu');
          emit('resolved');
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La suppression a échoué'));
        } finally {
          acting.value = false;
        }
      };

      onMounted(load);

      return {
        REPORT_TARGET_LABELS,
        deletableTargetLabel,
        ACCOUNT_STATUS_LABELS,
        ROLE_LABELS,
        detail,
        loading,
        acting,
        adminNotes,
        targetImage,
        targetImageFailed,
        ownerAvatar,
        ownerAvatarFailed,
        isNoisyReporter,
        statusBadgeClass,
        formatDate,
        formatDateTime,
        formatPrice,
        getInitial,
        resolve,
        deleteTargetAndResolve
      };
    }
  });
</script>
