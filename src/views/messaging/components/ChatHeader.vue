<template>
  <div class="chat-header">
    <button type="button" class="back-btn" aria-label="Retour aux conversations" @click="emit('back')">
      <i class="bi bi-chevron-compact-left"></i>
    </button>
    <div class="chat-participant">
      <div class="userPicture">
        <UserAvatar :user="conversation.otherParticipant" />
      </div>
      <div class="participant-info">
        <div class="participant-name">
          <span class="name">{{ conversation.otherParticipant?.username || conversation.username }}</span>
          <i v-if="favorite" class="bi bi-star-fill favorite-icon"></i>
        </div>
        <span class="status" :class="{ online: conversation.participants?.[0]?.isOnline }"></span>
      </div>
    </div>
    <div class="chat-actions">
      <button
        v-if="conversation.productId"
        type="button"
        class="action-btn btn_computer"
        title="Options de vente"
        aria-haspopup="menu"
        :aria-expanded="openMenu === 'sales'"
        @click.stop="toggleMenu('sales')"
      >
        <i class="bi bi-cash-coin"></i>
      </button>
      <button type="button" class="action-btn btn_computer" :title="favoriteLabel" @click="emit('toggle-favorite')">
        <i class="bi" :class="favorite ? 'bi-star-fill' : 'bi-star'"></i>
      </button>
      <button type="button" class="action-btn btn_computer" :title="readLabel" @click="emit('toggle-read')">
        <i class="bi" :class="hasUnread ? 'bi-check2-all' : 'bi-check2'"></i>
      </button>
      <button
        type="button"
        class="action-btn"
        title="Options"
        aria-haspopup="menu"
        :aria-expanded="openMenu === 'options'"
        @click.stop="toggleMenu('options')"
      >
        <i class="bi bi-three-dots"></i>
      </button>

      <!-- Le clic d'un élément remonte ici : le menu se ferme après l'action, sans atteindre le document. -->
      <div v-if="openMenu === 'sales'" class="dropdown-menu" role="menu" @click.stop="openMenu = null">
        <button type="button" class="dropdown-item" role="menuitem" @click="emit('offer')">
          <i class="bi bi-wallet"></i>
          Faire une offre
        </button>
        <button v-if="!conversation.isOwner" type="button" class="dropdown-item" role="menuitem" @click="emit('buy')">
          <i class="bi bi-credit-card"></i>
          Acheter
        </button>
      </div>

      <div v-if="openMenu === 'options'" class="dropdown-menu" role="menu" @click.stop="openMenu = null">
        <button type="button" class="dropdown-item" role="menuitem" @click="emit('archive')">
          <i class="bi bi-archive"></i>
          {{ archived ? 'Désarchiver' : 'Archiver' }}
        </button>
        <button type="button" class="dropdown-item information" role="menuitem" @click="emit('show-info')">
          <i class="bi bi-info-circle"></i>
          Information
        </button>
        <template v-if="conversation.productId">
          <button type="button" class="dropdown-item btn_mobile" role="menuitem" @click="emit('offer')">
            <i class="bi bi-wallet"></i>
            Faire une offre
          </button>
          <button v-if="!conversation.isOwner" type="button" class="dropdown-item btn_mobile" role="menuitem" @click="emit('buy')">
            <i class="bi bi-credit-card"></i>
            Acheter
          </button>
        </template>
        <button type="button" class="dropdown-item btn_mobile" role="menuitem" :title="favoriteLabel" @click="emit('toggle-favorite')">
          <i class="bi" :class="favorite ? 'bi-star-fill' : 'bi-star'"></i>
          <span>{{ favorite ? 'Retirer' : 'Ajouter' }}</span>
        </button>
        <button type="button" class="dropdown-item btn_mobile" role="menuitem" :title="readLabel" @click="emit('toggle-read')">
          <i class="bi" :class="hasUnread ? 'bi-check2-all' : 'bi-check2'"></i>
          <span>{{ hasUnread ? 'Lu' : 'Non lu' }}</span>
        </button>
        <button type="button" class="dropdown-item danger" role="menuitem" @click="emit('delete')">
          <i class="bi bi-trash"></i>
          Supprimer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** En-tête de la conversation ouverte : interlocuteur, raccourcis et menus d'actions. */
import { computed, ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import UserAvatar from '@/components/UserAvatar.vue'
import type { ViewConversation } from '../types'

const props = defineProps<{
  conversation: ViewConversation
  favorite: boolean
  archived: boolean
}>()

const emit = defineEmits<{
  back: []
  'toggle-favorite': []
  'toggle-read': []
  archive: []
  delete: []
  'show-info': []
  offer: []
  buy: []
}>()

/** Un seul menu ouvert à la fois. */
const openMenu = ref<'sales' | 'options' | null>(null)

const hasUnread = computed(() => (props.conversation.unreadCount ?? 0) > 0)
const favoriteLabel = computed(() => (props.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'))
const readLabel = computed(() => (hasUnread.value ? 'Marquer comme lu' : 'Marquer comme non lu'))

function toggleMenu(menu: 'sales' | 'options'): void {
  openMenu.value = openMenu.value === menu ? null : menu
}

// Les menus arrêtent leurs propres clics (@click.stop) : tout autre clic les ferme.
useEventListener(document, 'click', () => {
  openMenu.value = null
})
useEventListener(document, 'keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape') openMenu.value = null
})
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/chat_header.scss';
</style>
