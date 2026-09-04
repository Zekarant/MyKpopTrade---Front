<template>
  <div class="admin__modal-overlay" @click.self="$emit('close')">
    <div class="admin__modal admin__modal--wide" role="dialog" aria-modal="true" aria-labelledby="user-detail-title">
      <div class="admin__modal-header">
        <h3 id="user-detail-title">{{ detail?.user?.username || 'Fiche de modération' }}</h3>
        <button type="button" class="admin__icon-btn" aria-label="Fermer" @click="$emit('close')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="admin__modal-body">
        <div v-if="loading" class="admin__empty admin__empty--inline">
          <i class="bi bi-hourglass-split"></i>
          <p>Chargement de la fiche…</p>
        </div>

        <template v-else-if="detail">
          <div class="admin__meta-row" style="margin-bottom: var(--space-md)">
            <span class="admin__badge" :class="statusBadgeClass">
              {{ ACCOUNT_STATUS_LABELS[detail.user.accountStatus] || detail.user.accountStatus }}
            </span>
            <span class="admin__badge admin__badge--accent">
              {{ ROLE_LABELS[detail.user.role] || detail.user.role }}
            </span>
            <span v-if="detail.user.isIdentityVerified" class="admin__badge admin__badge--success">
              Identité vérifiée
            </span>
            <span v-if="!detail.user.isEmailVerified" class="admin__badge admin__badge--warning">
              Email non vérifié
            </span>
            <span class="admin__muted">inscrit le {{ formatDate(detail.user.createdAt) }}</span>
          </div>

          <div v-if="detail.user.suspension" class="admin__card" style="margin-bottom: var(--space-md)">
            <h3><i class="bi bi-slash-circle"></i> Suspension en cours</h3>
            <p style="margin: 0">
              {{ detail.user.suspension.reason }}
              —
              {{
                detail.user.suspension.until
                  ? `jusqu'au ${formatDate(detail.user.suspension.until)}`
                  : 'définitive'
              }}
            </p>
          </div>

          <div class="admin__panel-grid">
            <div class="admin__card">
              <h3><i class="bi bi-graph-up"></i> Activité</h3>
              <dl class="admin__definition-list">
                <div class="admin__definition">
                  <dt>Annonces publiées</dt>
                  <dd>{{ detail.activity.listings }}</dd>
                </div>
                <div class="admin__definition">
                  <dt>Signalements reçus</dt>
                  <dd :class="{ 'admin__badge admin__badge--danger': detail.activity.reportsAgainst > 0 }">
                    {{ detail.activity.reportsAgainst }}
                  </dd>
                </div>
                <div class="admin__definition">
                  <dt>Signalements émis</dt>
                  <dd>{{ detail.activity.reportsFiled }}</dd>
                </div>
                <div class="admin__definition">
                  <dt>Litiges impliqués</dt>
                  <dd>{{ detail.activity.disputes }}</dd>
                </div>
                <div class="admin__definition">
                  <dt>Dernière connexion</dt>
                  <dd>{{ formatDate(detail.user.lastLogin) }}</dd>
                </div>
              </dl>
            </div>

            <div class="admin__card">
              <h3><i class="bi bi-clock-history"></i> Sanctions</h3>
              <p v-if="!detail.user.sanctions?.length" class="admin__muted" style="margin: 0">
                Aucune sanction enregistrée.
              </p>
              <dl v-else class="admin__definition-list">
                <div v-for="(sanction, index) in reversedSanctions" :key="index" class="admin__definition">
                  <dt>
                    <span
                      class="admin__badge"
                      :class="sanction.action === 'suspend' ? 'admin__badge--danger' : 'admin__badge--success'"
                    >
                      {{ sanction.action === 'suspend' ? 'Suspension' : 'Réactivation' }}
                    </span>
                    <span class="admin__excerpt" :title="sanction.reason">{{ sanction.reason || '—' }}</span>
                  </dt>
                  <dd class="admin__muted">
                    {{ formatDateTime(sanction.at) }}
                    <template v-if="sanction.by?.username"><br />par {{ sanction.by.username }}</template>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div class="admin__card" style="margin-top: var(--space-md)">
            <h3><i class="bi bi-journal-bookmark"></i> Notes internes</h3>
            <p>Visibles des seuls administrateurs, jamais de l'utilisateur ni de son export RGPD.</p>

            <div v-if="notes.length" class="admin__note-list">
              <div v-for="note in reversedNotes" :key="note._id" class="admin__note">
                <p class="admin__note-content">{{ note.content }}</p>
                <div class="admin__note-meta">
                  <span>{{ note.author?.username || 'Administrateur' }} · {{ formatDateTime(note.createdAt) }}</span>
                  <button
                    type="button"
                    class="admin__icon-btn admin__icon-btn--danger"
                    title="Supprimer la note"
                    @click="removeNote(note)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="admin__field" style="margin: var(--space-md) 0 0">
              <label for="new-note">Ajouter une note</label>
              <textarea
                id="new-note"
                v-model="newNote"
                class="admin__textarea"
                rows="3"
                :maxlength="NOTE_MAX_LENGTH"
                placeholder="Ex. averti le 12/03 pour vente hors plateforme, à surveiller"
              ></textarea>
              <span class="admin__hint">{{ newNote.trim().length }} / {{ NOTE_MAX_LENGTH }}</span>
            </div>
            <button
              type="button"
              class="admin__btn admin__btn--primary"
              :disabled="!newNote.trim() || savingNote"
              @click="addNote"
            >
              <i class="bi bi-plus-lg"></i> {{ savingNote ? 'Enregistrement…' : 'Ajouter' }}
            </button>
          </div>
        </template>

        <div v-else class="admin__empty admin__empty--inline">
          <i class="bi bi-exclamation-circle"></i>
          <p>Fiche introuvable.</p>
        </div>
      </div>

      <div v-if="detail" class="admin__modal-footer">
        <button
          v-if="canSanction && detail.user.accountStatus === 'active'"
          type="button"
          class="admin__btn admin__btn--danger"
          @click="$emit('suspend', detail.user)"
        >
          <i class="bi bi-person-x"></i> Suspendre
        </button>
        <button
          v-if="canSanction && detail.user.accountStatus === 'suspended'"
          type="button"
          class="admin__btn admin__btn--primary"
          @click="$emit('reactivate', detail.user)"
        >
          <i class="bi bi-person-check"></i> Réactiver
        </button>
        <button type="button" class="admin__btn admin__btn--ghost" @click="$emit('close')">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onMounted, ref } from 'vue';
  import adminService from '@/services/admin.service';
  import { func } from '@/function';
  import {
    ACCOUNT_STATUS_LABELS,
    ROLE_LABELS,
    apiErrorMessage,
    formatDate,
    formatDateTime
  } from '../adminFormat';

  const NOTE_MAX_LENGTH = 2000;

  export default defineComponent({
    name: 'UserDetailModal',
    props: {
      userId: { type: String, required: true }
    },
    emits: ['close', 'suspend', 'reactivate', 'changed'],
    setup(props, { emit }) {
      const detail = ref<any>(null);
      const notes = ref<any[]>([]);
      const newNote = ref('');
      const loading = ref(true);
      const savingNote = ref(false);

      const reversedSanctions = computed(() => [...(detail.value?.user?.sanctions ?? [])].reverse());
      const reversedNotes = computed(() => [...notes.value].reverse());

      const canSanction = computed(() => detail.value?.user?.role !== 'admin');

      const statusBadgeClass = computed(
        () =>
          ({
            active: 'admin__badge--success',
            suspended: 'admin__badge--warning',
            deleted: 'admin__badge--danger'
          })[detail.value?.user?.accountStatus as string] || 'admin__badge'
      );

      const load = async () => {
        loading.value = true;
        try {
          detail.value = await adminService.getUserDetail(props.userId);
          notes.value = detail.value?.user?.adminNotes ?? [];
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger la fiche'));
          detail.value = null;
        } finally {
          loading.value = false;
        }
      };

      const addNote = async () => {
        const content = newNote.value.trim();
        if (!content || savingNote.value) return;

        savingNote.value = true;
        try {
          const data = await adminService.addUserNote(props.userId, content);
          notes.value = data.adminNotes ?? [];
          newNote.value = '';
          func.showToastSuccess('Note ajoutée');
          emit('changed');
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'L\'ajout de la note a échoué'));
        } finally {
          savingNote.value = false;
        }
      };

      const removeNote = async (note: any) => {
        if (!confirm('Supprimer cette note ?')) return;

        try {
          const data = await adminService.deleteUserNote(props.userId, note._id);
          notes.value = data.adminNotes ?? [];
          func.showToastSuccess('Note supprimée');
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La suppression a échoué'));
        }
      };

      onMounted(load);

      return {
        ACCOUNT_STATUS_LABELS,
        ROLE_LABELS,
        NOTE_MAX_LENGTH,
        detail,
        notes,
        newNote,
        loading,
        savingNote,
        reversedSanctions,
        reversedNotes,
        canSanction,
        statusBadgeClass,
        formatDate,
        formatDateTime,
        load,
        addNote,
        removeNote
      };
    }
  });
</script>
