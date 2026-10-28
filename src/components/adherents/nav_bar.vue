<template>
  <nav class="navbar" :class="{ 'navbar--open': menuOpen }">
    <div class="navbar__inner">
      <!-- Logo -->
      <RouterLink :to="{ name: 'dashboard' }" class="navbar__brand" @click="closeMenus">
        <span class="navbar__logo" aria-hidden="true">K</span>
        <span class="navbar__title">MyKpopTrade</span>
      </RouterLink>

      <!-- Desktop Navigation -->
      <div class="navbar__links">
        <RouterLink
          v-for="menu in itemMenu"
          :key="menu.page"
          :to="{ name: menu.page }"
          class="navbar__link"
          :class="{ 'navbar__link--active': menu.active }"
          :aria-current="menu.active ? 'page' : undefined"
          @click="closeMenus"
        >
          <i :class="menu.iconClass"></i>
          <span>{{ menu.label }}</span>
        </RouterLink>
      </div>

      <!-- Center action -->
      <button type="button" class="navbar__sell-btn" aria-label="Vendre" @click="goToSell">
        <i class="bi bi-plus-lg"></i>
        <span class="navbar__sell-text">Vendre</span>
      </button>

      <!-- Right section -->
      <div class="navbar__right">
        <!-- Notifications -->
        <div ref="notifWrapper" class="navbar__notif-wrapper">
          <button
            ref="notifTrigger"
            type="button"
            class="navbar__icon-btn"
            :aria-label="unreadNotifications > 0 ? `Notifications, ${unreadNotifications} non lues` : 'Notifications'"
            :aria-expanded="notificationsOpen"
            aria-controls="navbar-notifications"
            @click.stop="toggleNotifications"
          >
            <i class="bi bi-bell"></i>
            <span v-if="unreadNotifications > 0" class="navbar__badge" aria-hidden="true">{{ unreadNotifications > 9 ? '9+' : unreadNotifications }}</span>
          </button>
          <!-- Notifications dropdown -->
          <Transition name="dropdown">
            <div v-if="notificationsOpen" id="navbar-notifications" class="navbar__notif-dropdown" @click.stop>
              <div class="navbar__notif-header">
                <span class="navbar__notif-title">Notifications</span>
                <button v-if="notifications.length > 0" class="navbar__notif-mark-all" @click="markAllRead">Tout marquer comme lu</button>
              </div>
              <div class="navbar__notif-list">
                <div v-if="notifications.length === 0" class="navbar__notif-empty">
                  <i class="bi bi-bell-slash"></i>
                  <span>Aucune notification</span>
                </div>
                <div v-for="notif in notifications" :key="notif._id" class="navbar__notif-item" :class="{ 'navbar__notif-item--unread': !notif.isRead }">
                  <button type="button" class="navbar__notif-open" @click="onNotifClick(notif)">
                    <i class="bi" :class="getNotifIcon(notif.type)" aria-hidden="true"></i>
                    <span class="navbar__notif-content">
                      <span class="navbar__notif-text">{{ notif.content }}</span>
                      <span class="navbar__notif-time">{{ formatRelative(notif.createdAt) }}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    class="navbar__notif-delete"
                    aria-label="Supprimer la notification"
                    @click.stop="notificationStore.remove(notif._id)"
                  >
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Messages -->
        <RouterLink :to="{ name: 'messages' }" class="navbar__icon-btn" aria-label="Messages" @click="closeMenus">
          <i class="bi bi-chat-dots"></i>
        </RouterLink>

        <!-- Cart -->
        <RouterLink
          :to="{ name: 'cart' }"
          class="navbar__icon-btn"
          :aria-label="cartCount > 0 ? `Panier, ${cartCount} articles` : 'Panier'"
          @click="closeMenus"
        >
          <i class="bi bi-cart3"></i>
          <span v-if="cartCount > 0" class="navbar__badge" aria-hidden="true">{{ cartCount > 9 ? '9+' : cartCount }}</span>
        </RouterLink>

        <!-- Profile dropdown trigger -->
        <button
          ref="profileTrigger"
          type="button"
          class="navbar__profile"
          aria-label="Menu du compte"
          :aria-expanded="dropdownOpen"
          aria-controls="navbar-account-menu"
          @click.stop="toggleDropdown"
        >
          <span v-if="dataUser" class="navbar__avatar">
            <UserAvatar :user="dataUser" />
          </span>
          <span v-else class="navbar__avatar navbar__avatar--placeholder">
            <i class="bi bi-person-fill"></i>
          </span>
          <i class="bi bi-chevron-down navbar__chevron" :class="{ 'navbar__chevron--open': dropdownOpen }"></i>
        </button>

        <!-- Profile Dropdown -->
        <Transition name="dropdown">
          <div v-if="dropdownOpen" id="navbar-account-menu" ref="profileDropdown" class="navbar__dropdown" @click.stop>
            <div class="navbar__dropdown-header">
              <div v-if="dataUser" class="navbar__dropdown-avatar">
                <UserAvatar :user="dataUser" />
              </div>
              <div v-else class="navbar__dropdown-avatar navbar__dropdown-avatar--placeholder">
                <i class="bi bi-person-fill"></i>
              </div>
              <div class="navbar__dropdown-info">
                <span class="navbar__dropdown-name">{{ dataUser?.username || 'Utilisateur' }}</span>
                <span class="navbar__dropdown-sub">{{ fullName || 'Mon compte' }}</span>
              </div>
            </div>
            <div class="navbar__dropdown-divider"></div>
            <RouterLink :to="{ name: 'add_post' }" class="navbar__dropdown-item navbar__dropdown-item--accent" @click="closeMenus">
              <i class="bi bi-plus-circle"></i>
              Vendre un article
            </RouterLink>
            <RouterLink
              v-for="link in accountLinks"
              :key="link.label"
              :to="link.to"
              class="navbar__dropdown-item"
              @click="closeMenus"
            >
              <i :class="link.iconClass"></i>
              {{ link.label }}
            </RouterLink>
            <div class="navbar__dropdown-divider"></div>
            <RouterLink
              v-for="link in settingsLinks"
              :key="link.label"
              :to="link.to"
              class="navbar__dropdown-item"
              @click="closeMenus"
            >
              <i :class="link.iconClass"></i>
              {{ link.label }}
            </RouterLink>
            <div class="navbar__dropdown-divider"></div>
            <button type="button" class="navbar__dropdown-item navbar__dropdown-item--danger" @click="logout">
              <i class="bi bi-box-arrow-right"></i>
              Déconnexion
            </button>
          </div>
        </Transition>
      </div>

      <!-- Mobile toggle -->
      <button
        ref="menuToggle"
        type="button"
        class="navbar__toggle"
        aria-label="Menu"
        :aria-expanded="menuOpen"
        aria-controls="navbar-mobile-menu"
        @click="menuOpen = !menuOpen"
      >
        <span class="navbar__toggle-line"></span>
        <span class="navbar__toggle-line"></span>
        <span class="navbar__toggle-line"></span>
      </button>
    </div>

    <!-- Mobile menu -->
    <Transition name="slide-down">
      <div v-if="menuOpen" id="navbar-mobile-menu" class="navbar__mobile">
        <!-- Mobile user info -->
        <div class="navbar__mobile-user">
          <div v-if="dataUser" class="navbar__mobile-user-avatar">
            <UserAvatar :user="dataUser" />
          </div>
          <div v-else class="navbar__mobile-user-avatar navbar__mobile-user-avatar--placeholder">
            <i class="bi bi-person-fill"></i>
          </div>
          <span class="navbar__mobile-user-name">{{ dataUser?.username || 'Utilisateur' }}</span>
        </div>
        <div class="navbar__dropdown-divider"></div>
        <RouterLink
          v-for="menu in itemMenu"
          :key="menu.page"
          :to="{ name: menu.page }"
          class="navbar__mobile-link"
          :class="{ 'navbar__mobile-link--active': menu.active }"
          :aria-current="menu.active ? 'page' : undefined"
          @click="closeMenus"
        >
          <i :class="menu.iconClass"></i>
          <span>{{ menu.label }}</span>
        </RouterLink>
        <button type="button" class="btn btn-primary w-full mt-md" @click="goToSell">
          <i class="bi bi-plus-lg"></i>
          Vendre un article
        </button>
        <div class="navbar__dropdown-divider"></div>
        <RouterLink
          v-for="link in [...accountLinks, ...settingsLinks]"
          :key="link.label"
          :to="link.to"
          class="navbar__mobile-link"
          @click="closeMenus"
        >
          <i :class="link.iconClass"></i>
          <span>{{ link.label }}</span>
        </RouterLink>
        <button type="button" class="navbar__mobile-link navbar__mobile-link--danger" @click="logout">
          <i class="bi bi-box-arrow-right"></i>
          <span>Déconnexion</span>
        </button>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
/**
 * Barre de navigation des pages connectées. Rendue une seule fois par App.vue
 * (selon `meta.navbar` de la route) : elle survit aux navigations et lit
 * profil, panier et notifications dans les stores au lieu de les recharger à
 * chaque page.
 */
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter, type RouteLocationRaw, type RouteRecordNameGeneric } from 'vue-router';
import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import authentificationService from '@/services/authentification.service';
import type { Notification } from '@/services/notification.service';
import { safeRedirect } from '@/router/safeRedirect';
import { useUserStore } from '@/store/user.store';
import { useCartStore } from '@/store/cart.store';
import { useNotificationStore } from '@/store/notification.store';
import { startRealtimeSync } from '@/store/realtimeSync';
import { formatRelative } from '@/utils/format';
import UserAvatar from '@/components/UserAvatar.vue';

const route = useRoute();
const router = useRouter();

const userStore = useUserStore();
const cartStore = useCartStore();
const notificationStore = useNotificationStore();
const { profile: dataUser, isAdmin } = storeToRefs(userStore);
const { count: cartCount } = storeToRefs(cartStore);
const { notifications, unreadCount: unreadNotifications } = storeToRefs(notificationStore);

const dropdownOpen = ref(false);
const notificationsOpen = ref(false);
const menuOpen = ref(false);

const notifWrapper = ref<HTMLElement | null>(null);
const notifTrigger = ref<HTMLButtonElement | null>(null);
const profileTrigger = ref<HTMLButtonElement | null>(null);
const profileDropdown = ref<HTMLElement | null>(null);
const menuToggle = ref<HTMLButtonElement | null>(null);

const fullName = computed(() =>
  [dataUser.value?.firstName, dataUser.value?.lastName].filter(Boolean).join(' ')
);

function isActive(page: RouteRecordNameGeneric): boolean {
  if (route.name === 'conversation' && page === 'messages') return true;
  if (route.name !== page) return false;
  if (page === 'profile') return route.params?.id === 'me';
  return true;
}

// Calculé (et non posé une fois dans data()) : la barre n'est plus remontée à
// chaque page, l'entrée active doit donc suivre la route.
const itemMenu = computed(() => [
  { label: 'Accueil', iconClass: 'bi bi-house', page: 'dashboard' },
  { label: 'Rechercher', iconClass: 'bi bi-search', page: 'searchList' },
  { label: 'Contact', iconClass: 'bi bi-headset', page: 'contact' }
].map((item) => ({ ...item, active: isActive(item.page) })));

interface AccountLink {
  label: string;
  iconClass: string;
  to: RouteLocationRaw;
}

// Partagés par le menu du compte (bureau) et le menu mobile.
const accountLinks: AccountLink[] = [
  { label: 'Mon profil public', iconClass: 'bi bi-person', to: { name: 'profile', params: { id: 'me' } } },
  { label: 'Ma collection', iconClass: 'bi bi-collection', to: { name: 'collection' } },
  { label: 'Recherches sauvegardées', iconClass: 'bi bi-bookmark-star', to: { name: 'saved_searches' } },
  { label: 'Mes messages', iconClass: 'bi bi-envelope', to: { name: 'messages' } },
  { label: 'Mes paiements', iconClass: 'bi bi-receipt', to: { name: 'payments' } },
  { label: 'Mes litiges', iconClass: 'bi bi-shield-exclamation', to: { name: 'disputes' } }
];

const settingsLinks = computed<AccountLink[]>(() => [
  { label: 'Paramètres', iconClass: 'bi bi-gear', to: { name: 'settings' } },
  ...(isAdmin.value ? [{ label: 'Administration', iconClass: 'bi bi-shield-check', to: { name: 'admin' } }] : [])
]);

// Le déclencheur est ignoré : son propre @click bascule déjà le menu.
onClickOutside(profileDropdown, () => { dropdownOpen.value = false; }, { ignore: [profileTrigger] });
onClickOutside(notifWrapper, () => { notificationsOpen.value = false; });

// Escape ferme le menu ouvert et rend le focus à son déclencheur, pour que le
// clavier ne se retrouve pas en haut de la page.
onKeyStroke('Escape', () => {
  if (notificationsOpen.value) {
    notificationsOpen.value = false;
    notifTrigger.value?.focus();
  } else if (dropdownOpen.value) {
    dropdownOpen.value = false;
    profileTrigger.value?.focus();
  } else if (menuOpen.value) {
    menuOpen.value = false;
    menuToggle.value?.focus();
  }
});

onMounted(() => {
  userStore.fetchProfile().catch((error) => {
    console.error('Error fetching user information:', error);
  });
  notificationStore.fetch();
  cartStore.refresh();
  // La barre ne s'affiche qu'une fois connecté et survit aux navigations : le
  // flux est ouvert ici une fois, puis fermé à la déconnexion (resetSessionStores).
  startRealtimeSync();
});

function closeMenus() {
  menuOpen.value = false;
  dropdownOpen.value = false;
  notificationsOpen.value = false;
}

function goToSell() {
  closeMenus();
  router.push({ name: 'add_post' });
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
  if (dropdownOpen.value) notificationsOpen.value = false;
}

function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value;
  if (notificationsOpen.value) {
    dropdownOpen.value = false;
    // La barre ne se recharge plus à chaque page : la liste est rafraîchie à l'ouverture.
    notificationStore.fetch();
  }
}

function markAllRead() {
  notificationStore.markAllRead();
}

function onNotifClick(notif: Notification) {
  notificationStore.markRead(notif._id);
  notificationsOpen.value = false;
  // Le routeur traduit les anciens chemins de l'API (/account/…, /conversations/…).
  const target = safeRedirect(notif.link);
  if (target) router.push(target);
}

function getNotifIcon(type: string) {
  const icons: Record<string, string> = {
    message: 'bi-chat-dots',
    offer: 'bi-tag',
    counter_offer: 'bi-arrow-repeat',
    offer_accepted: 'bi-check-circle',
    offer_rejected: 'bi-x-circle',
    product_sold: 'bi-bag-check',
    order_status: 'bi-truck',
    system: 'bi-info-circle',
    rating_received: 'bi-star',
  };
  return icons[type] || 'bi-bell';
}

function logout() {
  authentificationService.logout();
}
</script>

<style lang="scss" scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--navbar-height);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--surface-border);
  backdrop-filter: blur(12px);
  z-index: var(--z-fixed);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.navbar__inner {
  display: flex;
  align-items: center;
  height: 100%;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--space-lg);
  gap: var(--space-md);
}

// Brand
.navbar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  flex-shrink: 0;
  text-decoration: none;
}

.navbar__logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-gradient);
  color: white;
  font-weight: 800;
  font-size: 1.1rem;
  border-radius: var(--radius-sm);
}

.navbar__title {
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

// Navigation links
.navbar__links {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-left: var(--space-xl);
}

.navbar__link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 16px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);

  &:hover {
    color: var(--text-primary);
    background: var(--surface-hover);
  }

  &--active,
  &--active:hover {
    color: var(--accent-pink);
    background: rgba(255, 45, 120, 0.08);
  }

  i {
    font-size: 1.1rem;
  }
}

// Sell button
.navbar__sell-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 20px;
  margin-left: auto;
  background: var(--accent-gradient);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 0 2px 12px rgba(255, 45, 120, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(255, 45, 120, 0.4);
  }

  i {
    font-size: 1rem;
  }
}

// Right section
.navbar__right {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.navbar__icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 1.1rem;
  text-decoration: none;

  &:hover {
    color: var(--accent-pink);
    border-color: var(--accent-pink);
    background: rgba(255, 45, 120, 0.05);
  }
}

.navbar__badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: var(--danger);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-primary);
}

// Notifications dropdown
.navbar__notif-wrapper {
  position: relative;
}

.navbar__notif-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 340px;
  max-height: 420px;
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.navbar__notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-md) var(--space-sm);
  border-bottom: 1px solid var(--surface-border);
}

.navbar__notif-title {
  font-weight: 700;
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.navbar__notif-mark-all {
  background: none;
  border: none;
  color: var(--accent-pink);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);

  &:hover { background: rgba(255, 45, 120, 0.05); }
}

.navbar__notif-list {
  overflow-y: auto;
  flex: 1;
}

.navbar__notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-2xl);
  color: var(--text-muted);
  font-size: var(--font-size-sm);

  i { font-size: 1.5rem; }
}

.navbar__notif-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--surface-border);

  &:hover { background: var(--surface-hover); }

  &--unread {
    background: rgba(255, 45, 120, 0.03);

    .navbar__notif-text { font-weight: 600; }
  }

  i {
    color: var(--accent-pink);
    font-size: 1rem;
    margin-top: 2px;
    flex-shrink: 0;
  }
}

// Bouton qui ouvre la notification : remet à zéro les styles natifs pour
// garder l'apparence de l'ancienne ligne cliquable.
.navbar__notif-open {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  flex: 1;
  min-width: 0;
  padding: 0;
  background: none;
  border: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.navbar__notif-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.navbar__notif-text {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.navbar__notif-time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.navbar__notif-delete {
  margin-left: auto;
  flex-shrink: 0;
  align-self: flex-start;
  padding: 0 var(--space-xs);
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;

  &:hover { color: var(--danger); }
}

.navbar__profile {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 4px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
  background: transparent;
  font: inherit;
  color: inherit;

  &:hover {
    background: var(--surface-hover);
    border-color: var(--surface-border);
  }
}

.navbar__chevron {
  font-size: 0.7rem;
  color: var(--text-muted);
  transition: transform var(--transition-fast);

  &--open {
    transform: rotate(180deg);
  }
}

.navbar__avatar {
  display: block;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;

  &--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-tertiary);
    color: var(--text-muted);
    font-size: 1.1rem;
  }

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-full);
  }
}

.navbar__logout-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-full);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    color: var(--danger);
    border-color: var(--danger);
  }
}

// Dropdown
.navbar__dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  min-width: 240px;
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-sm);
  z-index: var(--z-dropdown);
}

.navbar__dropdown-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-sm);
}

.navbar__dropdown-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;

  &--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-gradient-subtle);
    color: var(--accent-pink);
    font-size: 1.2rem;
  }

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-full);
  }
}

.navbar__dropdown-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.navbar__dropdown-name {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.navbar__dropdown-sub {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.navbar__dropdown-divider {
  height: 1px;
  background: var(--surface-border);
  margin: var(--space-xs) 0;
}

// Liens et bouton (déconnexion) partagent ce style : remise à zéro du bouton natif.
.navbar__dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: 10px 12px;
  font: inherit;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-align: left;
  text-decoration: none;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  &--danger {
    color: var(--danger);
    &:hover {
      background: var(--danger-light);
      color: var(--danger);
    }
  }

  &--accent {
    color: var(--accent-pink);
    font-weight: 600;
    &:hover {
      background: rgba(255, 45, 120, 0.08);
      color: var(--accent-pink);
    }
  }

  i {
    font-size: 1.1rem;
    width: 20px;
    text-align: center;
  }
}

// Mobile toggle
.navbar__toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
}

.navbar__toggle-line {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all var(--transition-fast);
}

// Mobile menu
.navbar__mobile {
  position: absolute;
  top: var(--navbar-height);
  left: 0;
  right: 0;
  background: var(--bg-card);
  border-bottom: 1px solid var(--surface-border);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  box-shadow: var(--shadow-lg);
}

.navbar__mobile-user {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
}

.navbar__mobile-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;

  &--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-gradient-subtle);
    color: var(--accent-pink);
    font-size: 1.2rem;
  }

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-full);
  }
}

.navbar__mobile-user-name {
  font-weight: 600;
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.navbar__mobile-link {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  padding: 14px 16px;
  font: inherit;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-secondary);
  text-align: left;
  text-decoration: none;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  &--active {
    color: var(--accent-pink);
    background: rgba(255, 45, 120, 0.08);
  }

  &--danger {
    color: var(--danger);
    margin-top: var(--space-sm);
    border-top: 1px solid var(--surface-border);
    padding-top: var(--space-lg);
  }
}

// Transitions
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-fast);
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--transition-base);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// Responsive
@media (max-width: 768px) {
  .navbar__links,
  .navbar__sell-btn .navbar__sell-text,
  .navbar__icon-btn,
  .navbar__notif-wrapper,
  .navbar__profile,
  .navbar__dropdown,
  .navbar__right {
    display: none;
  }

  .navbar__inner {
    width: 100%;
    max-width: 100%;
    margin: 0;
    gap: var(--space-sm);
    padding: 0 var(--space-md);
  }

  // brand stays left; this pushes the "+ / burger" group to the right edge
  .navbar__sell-btn {
    margin-left: auto;
    padding: 10px 14px;
  }

  .navbar__toggle {
    display: flex;
  }

  .navbar--open .navbar__toggle-line:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }
  .navbar--open .navbar__toggle-line:nth-child(2) {
    opacity: 0;
  }
  .navbar--open .navbar__toggle-line:nth-child(3) {
    transform: rotate(-45deg) translate(5px, -5px);
  }
}

@media (min-width: 769px) {
  .navbar__mobile {
    display: none;
  }
}
</style>
