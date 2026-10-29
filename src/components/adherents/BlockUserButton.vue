<template>
  <button
    ref="triggerButton"
    type="button"
    class="block-user-btn"
    :class="{ 'block-user-btn--active': status.blockedByMe }"
    :disabled="loading"
    @click="openConfirm"
  >
    <i class="bi" :class="status.blockedByMe ? 'bi-unlock' : 'bi-slash-circle'"></i>
    {{ status.blockedByMe ? 'Débloquer' : 'Bloquer' }}
  </button>

  <!-- Téléporté : un parent transformé (panneau latéral mobile) casserait le position: fixed. -->
  <Teleport to="body">
    <div v-if="confirming" v-dismiss="closeConfirm" class="popup-overlay" @keydown.esc="closeConfirm">
      <div
        class="block-confirm"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="textId"
      >
        <h3 :id="titleId" class="block-confirm__title">{{ confirmTitle }}</h3>
        <p :id="textId" class="block-confirm__text">{{ confirmText }}</p>
        <div class="block-confirm__actions">
          <button ref="cancelButton" type="button" class="block-confirm__btn" @click="closeConfirm">
            Annuler
          </button>
          <button
            type="button"
            class="block-confirm__btn block-confirm__btn--confirm"
            :disabled="loading"
            @click="confirmAction"
          >
            {{ status.blockedByMe ? 'Débloquer' : 'Bloquer' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/** Bouton « Bloquer » / « Débloquer » un membre, avec confirmation. */
import { computed, nextTick, ref, useId, watch } from 'vue'
import { func } from '@/function'
import blockService, { type BlockStatus } from '@/services/block.service'
import { apiErrorMessage } from '@/services/apiError'
import { vDismiss } from '@/composables/vDismiss'

const props = defineProps<{
  userId: string
  username?: string
  /** Situation déjà connue (ex. détail d'une conversation) : évite un appel de plus. */
  initialStatus?: BlockStatus | null
}>()

const emit = defineEmits<{ change: [status: BlockStatus] }>()

const status = ref<BlockStatus>({ isBlocked: false, blockedByMe: false })
const loading = ref(false)
const confirming = ref(false)
const triggerButton = ref<HTMLButtonElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)
const titleId = `block-confirm-title-${useId()}`
const textId = `block-confirm-text-${useId()}`

const displayName = computed(() => props.username || 'ce membre')
const confirmTitle = computed(() =>
  status.value.blockedByMe ? `Débloquer ${displayName.value} ?` : `Bloquer ${displayName.value} ?`
)
const confirmText = computed(() =>
  status.value.blockedByMe
    ? 'Vous pourrez de nouveau échanger avec ce membre. Les abonnements retirés au blocage ne sont pas rétablis.'
    : 'Vous ne pourrez plus échanger de messages, d\'offres ni d\'avis avec ce membre, et vos abonnements mutuels seront retirés. Vos conversations passées restent consultables.'
)

async function loadStatus() {
  if (props.initialStatus) {
    status.value = { ...props.initialStatus }
    return
  }
  if (!props.userId) return
  try {
    status.value = await blockService.getStatus(props.userId)
  } catch {
    // Situation inconnue : le bouton reste sur « Bloquer », l'API tranchera à l'action.
  }
}

watch(() => [props.userId, props.initialStatus], loadStatus, { immediate: true })

async function openConfirm() {
  confirming.value = true
  await nextTick()
  // Annuler par défaut : une validation au clavier ne doit pas bloquer par mégarde.
  cancelButton.value?.focus()
}

function closeConfirm() {
  confirming.value = false
  triggerButton.value?.focus()
}

async function confirmAction() {
  const wasBlockedByMe = status.value.blockedByMe
  loading.value = true
  try {
    if (wasBlockedByMe) {
      await blockService.unblock(props.userId)
      // Débloquer ne lève pas un éventuel blocage posé par l'autre membre : on relit la situation.
      status.value = await blockService.getStatus(props.userId)
      func.showToastSuccess(`${displayName.value} est débloqué.`)
    } else {
      await blockService.block(props.userId)
      status.value = { isBlocked: true, blockedByMe: true }
      func.showToastSuccess(`${displayName.value} est bloqué.`)
    }
    emit('change', { ...status.value })
    closeConfirm()
  } catch (error) {
    func.showToastError(apiErrorMessage(error, wasBlockedByMe ? 'Impossible de débloquer ce membre.' : 'Impossible de bloquer ce membre.'))
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.block-user-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--danger);
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--danger);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled),
  &--active {
    background: var(--danger);
    color: var(--text-on-accent);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.block-confirm {
  background: var(--bg-card);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-xl, 0 10px 30px rgba(0, 0, 0, 0.2));
  width: 92%;
  max-width: 420px;
  padding: var(--space-xl, 24px);
}

.block-confirm__title {
  margin: 0 0 8px;
  font-size: var(--font-size-lg, 1.1rem);
  font-weight: 700;
  color: var(--text-primary, inherit);
}

.block-confirm__text {
  margin: 0 0 var(--space-lg, 16px);
  font-size: var(--font-size-sm, 0.9rem);
  color: var(--text-secondary, inherit);
}

.block-confirm__actions {
  display: flex;
  gap: var(--space-sm, 8px);
}

.block-confirm__btn {
  flex: 1;
  padding: 10px 14px;
  border: none;
  border-radius: var(--radius-md, 8px);
  background: var(--surface-hover, var(--bg-tertiary));
  color: var(--text-secondary, inherit);
  font-weight: 600;
  cursor: pointer;

  &--confirm {
    background: var(--danger);
    color: var(--text-on-accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
