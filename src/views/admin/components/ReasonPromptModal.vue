<template>
  <div v-dismiss="() => emit('cancel')" class="popup-overlay">
    <div ref="dialogEl" class="admin__modal" role="dialog" aria-modal="true" aria-labelledby="reason-title">
      <div class="admin__modal-header">
        <h3 id="reason-title">{{ title }}</h3>
        <button type="button" class="admin__icon-btn" aria-label="Fermer" @click="emit('cancel')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="admin__modal-body">
        <p v-if="description" class="admin__muted mt-0 mb-3">{{ description }}</p>

        <div class="admin__field">
          <label>Motifs courants</label>
          <div class="admin__preset-list">
            <button
              v-for="preset in presets"
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
          <label for="reason-text">Motif retenu</label>
          <textarea
            id="reason-text"
            ref="textarea"
            v-model="reason"
            class="admin__textarea"
            rows="3"
            :maxlength="maxLength"
            :placeholder="placeholder"
          ></textarea>
          <span class="admin__hint">
            {{ reason.trim().length }} / {{ maxLength }}
            <template v-if="required"> — {{ minLength }} caractères minimum</template>
            <template v-else> — facultatif</template>
          </span>
        </div>
      </div>

      <div class="admin__modal-footer">
        <button type="button" class="admin__btn admin__btn--ghost" @click="emit('cancel')">Annuler</button>
        <button
          type="button"
          class="admin__btn"
          :class="destructive ? 'admin__btn--danger' : 'admin__btn--primary'"
          :disabled="!isValid"
          @click="emit('confirm', reason.trim())"
        >
          <i :class="confirmIcon"></i> {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useDialogFocus } from '@/composables/useDialogFocus';
import { vDismiss } from '@/composables/vDismiss';

const minLength = 5;

const props = withDefaults(defineProps<{
  title: string;
  description?: string;
  presets?: string[];
  confirmLabel?: string;
  confirmIcon?: string;
  placeholder?: string;
  required?: boolean;
  destructive?: boolean;
  maxLength?: number;
}>(), {
  description: '',
  presets: () => [],
  confirmLabel: 'Confirmer',
  confirmIcon: 'bi bi-check-lg',
  placeholder: 'Précisez le motif…',
  required: false,
  destructive: false,
  maxLength: 500
});

const emit = defineEmits<{ confirm: [reason: string]; cancel: [] }>();

const dialogEl = ref<HTMLElement | null>(null);
useDialogFocus(dialogEl, undefined, () => emit('cancel'));

const reason = ref('');
const textarea = ref<HTMLTextAreaElement | null>(null);

const isValid = computed(() => (props.required ? reason.value.trim().length >= minLength : true));

onMounted(() => textarea.value?.focus());
</script>
