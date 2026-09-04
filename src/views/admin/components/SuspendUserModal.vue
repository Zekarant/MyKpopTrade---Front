<template>
  <div class="admin__modal-overlay" @click.self="$emit('close')">
    <div class="admin__modal" role="dialog" aria-modal="true" aria-labelledby="suspend-title">
      <div class="admin__modal-header">
        <h3 id="suspend-title">Suspendre {{ user.username }}</h3>
        <button type="button" class="admin__icon-btn" aria-label="Fermer" @click="$emit('close')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <form class="admin__modal-body" @submit.prevent="submit">
        <div class="admin__field">
          <label for="suspend-duration">Durée</label>
          <select id="suspend-duration" v-model="durationChoice" class="admin__select">
            <option v-for="option in DURATION_OPTIONS" :key="option.label" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <span class="admin__hint">{{ deadlineHint }}</span>
        </div>

        <div class="admin__field">
          <label>Motifs courants</label>
          <div class="admin__preset-list">
            <button
              v-for="preset in SUSPENSION_REASONS"
              :key="preset"
              type="button"
              class="admin__preset"
              :class="{ 'admin__preset--active': reason === preset }"
              @click="reason = preset"
            >
              {{ preset }}
            </button>
          </div>
        </div>

        <div class="admin__field">
          <label for="suspend-reason">Motif</label>
          <textarea
            id="suspend-reason"
            v-model="reason"
            class="admin__textarea"
            rows="4"
            :maxlength="MAX_REASON_LENGTH"
            required
            placeholder="Motif communiqué à l'utilisateur et conservé dans l'historique des sanctions"
          ></textarea>
          <span class="admin__hint">
            {{ reason.trim().length }} / {{ MAX_REASON_LENGTH }} —
            {{ MIN_REASON_LENGTH }} caractères minimum. L'utilisateur reçoit ce motif.
          </span>
        </div>
      </form>

      <div class="admin__modal-footer">
        <button type="button" class="admin__btn admin__btn--ghost" @click="$emit('close')">Annuler</button>
        <button type="button" class="admin__btn admin__btn--danger" :disabled="!isValid || submitting" @click="submit">
          <i class="bi bi-person-x"></i>
          {{ submitting ? 'Suspension…' : 'Suspendre' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, ref, type PropType } from 'vue';
  import adminService from '@/services/admin.service';
  import { func } from '@/function';
  import { apiErrorMessage } from '../adminFormat';
  import { SUSPENSION_REASONS } from '../adminPresets';

  const MIN_REASON_LENGTH = 5;
  const MAX_REASON_LENGTH = 500;

  const DURATION_OPTIONS: { label: string; value: number | null }[] = [
    { label: '24 heures', value: 1 },
    { label: '7 jours', value: 7 },
    { label: '30 jours', value: 30 },
    { label: '90 jours', value: 90 },
    { label: 'Définitive', value: null }
  ];

  export default defineComponent({
    name: 'SuspendUserModal',
    props: {
      user: { type: Object as PropType<{ _id: string; username: string }>, required: true }
    },
    emits: ['close', 'confirmed'],
    setup(props, { emit }) {
      const reason = ref('');
      const durationChoice = ref<number | null>(7);
      const submitting = ref(false);

      const isValid = computed(() => reason.value.trim().length >= MIN_REASON_LENGTH);

      const deadlineHint = computed(() => {
        if (durationChoice.value === null) {
          return 'Le compte restera suspendu jusqu\'à une réactivation manuelle.';
        }
        const end = new Date(Date.now() + durationChoice.value * 24 * 60 * 60 * 1000);
        return `Réactivation automatique le ${end.toLocaleDateString('fr-FR')}.`;
      });

      const submit = async () => {
        if (!isValid.value || submitting.value) return;

        submitting.value = true;
        try {
          await adminService.updateUserStatus(props.user._id, 'suspended', {
            reason: reason.value.trim(),
            durationDays: durationChoice.value
          });
          func.showToastSuccess(`${props.user.username} a été suspendu`);
          emit('confirmed');
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La suspension a échoué'));
        } finally {
          submitting.value = false;
        }
      };

      return {
        MIN_REASON_LENGTH,
        MAX_REASON_LENGTH,
        DURATION_OPTIONS,
        SUSPENSION_REASONS,
        reason,
        durationChoice,
        submitting,
        isValid,
        deadlineHint,
        submit
      };
    }
  });
</script>
