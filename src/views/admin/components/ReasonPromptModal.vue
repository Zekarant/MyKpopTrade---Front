<template>
  <div class="admin__modal-overlay" @click.self="$emit('cancel')">
    <div class="admin__modal" role="dialog" aria-modal="true" aria-labelledby="reason-title">
      <div class="admin__modal-header">
        <h3 id="reason-title">{{ title }}</h3>
        <button type="button" class="admin__icon-btn" aria-label="Fermer" @click="$emit('cancel')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="admin__modal-body">
        <p v-if="description" class="admin__muted" style="margin: 0 0 var(--space-md)">{{ description }}</p>

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
        <button type="button" class="admin__btn admin__btn--ghost" @click="$emit('cancel')">Annuler</button>
        <button
          type="button"
          class="admin__btn"
          :class="destructive ? 'admin__btn--danger' : 'admin__btn--primary'"
          :disabled="!isValid"
          @click="$emit('confirm', reason.trim())"
        >
          <i :class="confirmIcon"></i> {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onMounted, ref, type PropType } from 'vue';

  const MIN_REASON_LENGTH = 5;

  export default defineComponent({
    name: 'ReasonPromptModal',
    props: {
      title: { type: String, required: true },
      description: { type: String, default: '' },
      presets: { type: Array as PropType<string[]>, default: () => [] },
      confirmLabel: { type: String, default: 'Confirmer' },
      confirmIcon: { type: String, default: 'bi bi-check-lg' },
      placeholder: { type: String, default: 'Précisez le motif…' },
      required: { type: Boolean, default: false },
      destructive: { type: Boolean, default: false },
      maxLength: { type: Number, default: 500 }
    },
    emits: ['confirm', 'cancel'],
    setup(props) {
      const reason = ref('');
      const textarea = ref<HTMLTextAreaElement | null>(null);

      const isValid = computed(() =>
        props.required ? reason.value.trim().length >= MIN_REASON_LENGTH : true
      );

      onMounted(() => textarea.value?.focus());

      return { reason, textarea, isValid, minLength: MIN_REASON_LENGTH };
    }
  });
</script>
