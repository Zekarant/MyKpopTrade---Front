<template>
  <main class="page">
    <div class="messaging-container">
      <ConversationSidebar
        v-model:active-tab="activeTab"
        v-model:search-query="searchQuery"
        :user-info="userStore.profile"
        :user-id="currentUserId()"
        :conversations="filteredConversations"
        :counts="tabCounts"
        :loading="loading"
        :selected-conversation="selectedConversation"
        :open-menu-id="openMenuId"
        @select="selectConversation"
        @toggle-menu="toggleConversationMenu"
        @toggle-favorite="toggleFavorite"
        @toggle-read="toggleRead"
        @archive="toggleArchive"
        @delete="removeConversation"
        @new-conversation="newConversationOpen = true"
      />

      <div class="chat-area" :class="{ active: selectedConversation !== null }">
        <div v-if="!selectedConversation" class="no-conversation">
          <div class="empty-state">
            <i class="bi bi-chat-dots"></i>
            <h3>Sélectionnez une conversation</h3>
            <p>Choisissez une conversation dans la liste ou démarrez-en une nouvelle</p>
            <button type="button" class="btn-primary" @click="newConversationOpen = true">
              <i class="bi bi-plus"></i>
              Nouvelle conversation
            </button>
          </div>
        </div>

        <div v-else class="active-chat">
          <ChatHeader
            :conversation="selectedConversation"
            :favorite="isFavoriteConversation(selectedConversation, currentUserId())"
            :archived="isArchivedConversation(selectedConversation, currentUserId())"
            @back="closeConversation"
            @toggle-favorite="toggleFavorite(selectedConversation)"
            @toggle-read="toggleRead(selectedConversation)"
            @archive="toggleArchive(selectedConversation)"
            @delete="removeConversation(selectedConversation)"
            @show-info="infoOpen = !infoOpen"
            @offer="openOffer"
            @buy="checkoutOpen = !checkoutOpen"
          />

          <MessageThread
            ref="threadView"
            :messages="messages"
            :conversation="selectedConversation"
            :user-id="currentUserId()"
            :loading-older="loadingOlder"
            :has-more="pagination.hasMore"
            @load-older="loadOlder(entityId(selectedConversation))"
            @open-attachments="openViewer"
            @cancel-offer="cancelOffer"
            @accept-offer="acceptOffer"
            @decline-offer="declineOpen = true"
          />

          <MessageComposer
            ref="composerView"
            :conversation-id="entityId(selectedConversation)"
            :blocked="Boolean(selectedConversation.isBlocked)"
            :blocked-by-me="Boolean(selectedConversation.blockedByMe)"
            @sent="showMessage"
            @blocked="onSendBlocked"
            @preview="openViewer"
          />
        </div>
      </div>

      <ConversationInfoPanel
        v-if="selectedConversation"
        :conversation="selectedConversation"
        :user-id="currentUserId()"
        :open="infoOpen"
        @close="infoOpen = false"
        @open-media="openViewer"
        @block-change="onBlockChange"
      />

      <send_message
        v-if="newConversationOpen"
        @close-send-message="newConversationOpen = false"
        @new-conversation-created="onNewConversationCreated"
      />

      <AttachmentViewer v-if="viewer" :images="viewer.images" :index="viewer.index" @close="viewer = null" />

      <CheckoutDialog
        v-if="checkoutOpen && selectedConversation?.productId"
        :product-id="selectedConversation.productId._id"
        :product-title="selectedConversation.productId.title"
        :product-price="checkoutPrice"
        :currency="selectedConversation.productId.currency || 'EUR'"
        :shipping-options="selectedConversation.productId.shippingOptions || {}"
        @confirm="onCheckoutConfirmed"
        @cancel="checkoutOpen = false"
      />

      <send_offer
        v-if="offerOpen && selectedConversation?.productId"
        :conversation="selectedConversation"
        @offer-sent="onOfferSent"
        @close="offerOpen = false"
      />

      <CounterOfferDialog
        v-if="counterOpen"
        :submitting="offerSubmitting"
        :error="counterError"
        @submit="sendCounterOffer"
        @cancel="counterOpen = false"
      />

      <DeclineOfferDialog v-if="declineOpen" @confirm="declineOffer" @cancel="declineOpen = false" />
    </div>
  </main>
</template>

<script setup lang="ts">
/**
 * Messagerie : relie la liste des conversations, la conversation ouverte
 * (en-tête, fil, saisie), le panneau d'informations et les fenêtres d'offre.
 * La logique vit dans les composables, l'affichage dans les composants.
 */
import { computed, getCurrentInstance, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import { useMessagingStore, applyReadReceipt, type ReadReceipt } from '@/store/messaging.store'
import { useUserStore } from '@/store/user.store'
import { currentUserId as sessionUserId } from '@/services/session.cookies'
import type { BlockStatus } from '@/services/block.service'
import send_message from '@/components/adherents/send_message.vue'
import send_offer from '@/components/send_offer.vue'
import CheckoutDialog from '@/components/checkout/CheckoutDialog.vue'
import ConversationSidebar from './components/ConversationSidebar.vue'
import ConversationInfoPanel from './components/ConversationInfoPanel.vue'
import ChatHeader from './components/ChatHeader.vue'
import MessageThread from './components/MessageThread.vue'
import MessageComposer from './components/MessageComposer.vue'
import AttachmentViewer from './components/AttachmentViewer.vue'
import CounterOfferDialog from './components/CounterOfferDialog.vue'
import DeclineOfferDialog from './components/DeclineOfferDialog.vue'
import { useConversationMessages } from './composables/useConversationMessages'
import { useConversationActions } from './composables/useConversationActions'
import { useOfferActions, type OfferInfo } from './composables/useOfferActions'
import { useCheckout } from './composables/useCheckout'
import type { ViewConversation, ViewMessage } from './types'
import {
  countConversationsByTab,
  entityId,
  filterConversations,
  findMatchingConversation,
  isArchivedConversation,
  isFavoriteConversation,
  isOwnMessage,
  type ConversationLike
} from './conversationHelpers'

const messagingStore = useMessagingStore()
// Profil partagé avec la barre de navigation : chargé une fois par session.
const userStore = useUserStore()
const route = useRoute()
const toast = getCurrentInstance()!.proxy!.$func

const activeTab = ref('all')
const searchQuery = ref('')
const loading = ref(false)
const selectedConversation = ref<ViewConversation | null>(null)
/** Conversation dont le menu « ... » est ouvert dans la colonne de gauche. */
const openMenuId = ref<string | null | undefined>(null)
const newConversationOpen = ref(false)
const infoOpen = ref(false)
const viewer = ref<{ images: string[]; index: number } | null>(null)

const threadView = useTemplateRef<InstanceType<typeof MessageThread>>('threadView')
const composerView = useTemplateRef<InstanceType<typeof MessageComposer>>('composerView')

const currentUserId = (): string | null =>
  sessionUserId() || userStore.profile?.id || userStore.profile?._id || null

const {
  messages,
  pagination,
  loadingOlder,
  load: loadMessages,
  loadOlder,
  append: appendMessage,
  clear: clearMessages
} = useConversationMessages(messagingStore)

const {
  checkoutOpen,
  productPrice: checkoutPrice,
  onConfirmed: onCheckoutConfirmed
} = useCheckout(selectedConversation, (message) => toast.showToastError(message))

const { toggleFavorite, toggleRead, toggleArchive, remove: removeConversation } = useConversationActions({
  store: messagingStore,
  selected: selectedConversation,
  userId: currentUserId,
  reload: (conversation) => void selectConversation(conversation),
  closeMenus: () => {
    openMenuId.value = null
  }
})

const {
  offerOpen,
  counterOpen,
  declineOpen,
  submitting: offerSubmitting,
  counterError,
  openOffer,
  sendOffer,
  sendCounterOffer,
  accept: acceptOffer,
  decline: declineOffer,
  cancel: cancelOffer
} = useOfferActions({
  store: messagingStore,
  selected: selectedConversation,
  toast,
  reload: (conversation) => void selectConversation(conversation),
  onOfferPosted: showMessage
})

const filteredConversations = computed(() =>
  filterConversations((messagingStore.sortedConversations || []) as ConversationLike[], {
    tab: activeTab.value,
    query: searchQuery.value,
    userId: currentUserId()
  }) as ViewConversation[]
)

const tabCounts = computed(() =>
  countConversationsByTab((messagingStore.conversations || []) as ConversationLike[], currentUserId())
)

async function scrollToBottom(): Promise<void> {
  await nextTick()
  threadView.value?.scrollToBottom()
}

async function selectConversation(conversation: ViewConversation): Promise<void> {
  selectedConversation.value = conversation
  openMenuId.value = null

  try {
    loading.value = true
    if ((conversation.unreadCount ?? 0) > 0) {
      await messagingStore.markAsRead(entityId(conversation))
    }

    const response = await loadMessages(entityId(conversation), conversation.messages)
    const detail: ViewConversation = response.conversation
    // Le détail fournit l'interlocuteur complet (badges, statistiques) : la liste ne sert que de repli.
    detail.otherParticipant = detail.otherParticipant ?? conversation.otherParticipant
    detail.media = response.media || []
    selectedConversation.value = detail
    await scrollToBottom()
  } catch (error) {
    console.error('Erreur lors de la sélection de la conversation:', error)
  } finally {
    loading.value = false
  }
}

function closeConversation(): void {
  selectedConversation.value = null
  viewer.value = null
  clearMessages()
}

function toggleConversationMenu(conversationId: string | undefined): void {
  openMenuId.value = openMenuId.value === conversationId ? null : conversationId
}

/** Message envoyé depuis cet onglet (réponse HTTP) ou offre tout juste créée. */
function showMessage(message: ViewMessage): void {
  if (appendMessage(message)) void scrollToBottom()
}

/** Blocage posé par l'interlocuteur depuis l'ouverture : la saisie se désactive. */
function onSendBlocked(): void {
  if (!selectedConversation.value) return
  selectedConversation.value.isBlocked = true
  toast.showToastError('Vous ne pouvez plus envoyer de messages dans cette conversation.')
}

/** Le blocage se gère depuis le panneau d'informations ; la saisie suit son état. */
function onBlockChange(status: BlockStatus): void {
  if (!selectedConversation.value) return
  selectedConversation.value.isBlocked = status.isBlocked
  selectedConversation.value.blockedByMe = status.blockedByMe
}

/** Une offre envoyée part avec le texte en cours de saisie, s'il y en a un. */
async function onOfferSent(offerInfo: OfferInfo): Promise<void> {
  sendOffer(offerInfo)
  await composerView.value?.send()
}

function openViewer(images: string[], index: number): void {
  viewer.value = { images: [...images], index }
}

/** Conversation créée depuis la fenêtre « Nouvelle conversation » : jamais de doublon dans la liste. */
function onNewConversationCreated(created: ViewConversation): void {
  const existing = findMatchingConversation(messagingStore.conversations as ViewConversation[], created, currentUserId())
  if (!existing) messagingStore.conversations.unshift(created)
  void selectConversation(existing ?? created)
  newConversationOpen.value = false
}

const isOpenConversation = (id: string) =>
  selectedConversation.value !== null && entityId(selectedConversation.value) === id

async function onRealtimeMessage(message: ViewMessage): Promise<void> {
  // Déjà affiché : envoyé depuis cet onglet, ou reçu avant la réponse de l'envoi.
  if (!isOpenConversation(message.conversation) || !appendMessage(message)) return

  await scrollToBottom()
  // Conversation sous les yeux : le message est lu, l'expéditeur en est averti.
  if (!isOwnMessage(message, currentUserId()) && document.visibilityState === 'visible') {
    await messagingStore.markAsRead(message.conversation)
  }
}

function onRealtimeReadReceipt(receipt: ReadReceipt): void {
  if (isOpenConversation(receipt.conversationId)) applyReadReceipt(messages.value, receipt)
}

// La vue garde sa propre liste de messages affichés : elle suit les actions
// du store déclenchées par le flux temps réel (cf. store/realtimeSync.ts).
// Abonnement lié au composant, retiré à son démontage.
messagingStore.$onAction(({ name, args, after }) => {
  if (name === 'handleNewMessage') after(() => onRealtimeMessage(args[0] as ViewMessage))
  else if (name === 'handleConversationRead') after(() => onRealtimeReadReceipt(args[0] as ReadReceipt))
})

// Les menus de la colonne de gauche arrêtent leurs clics (@click.stop) : tout
// autre clic dans la page les ferme. Écouteur retiré au démontage.
useEventListener(document, 'click', () => {
  openMenuId.value = null
})

onMounted(async () => {
  try {
    loading.value = true

    // Le profil ne sert qu'à l'en-tête : son échec ne doit pas priver de la messagerie.
    await userStore.fetchProfile().catch(() => null)
    await messagingStore.fetchConversations()

    if (messagingStore.conversations.length > 0) {
      // /adherents/messages/:id ouvre cette conversation ; sinon, la plus récente.
      const requestedId = route.params.id
      const requested = requestedId
        ? messagingStore.conversations.find((c: ViewConversation) => entityId(c) === requestedId)
        : null
      await selectConversation(requested || messagingStore.conversations[0])
    }
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
@use '../../css/messaging/messages_view.scss';
</style>
