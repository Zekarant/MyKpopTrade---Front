<template>
  <nav class="navbar" :class="{ 'navbar--open': menuOpen }">
    <div class="navbar__inner">
      <!-- Logo -->
      <div class="navbar__brand" @click="navPage('dashboard', null)">
        <span class="navbar__logo">K</span>
        <span class="navbar__title">MyKpopTrade</span>
      </div>

      <!-- Desktop Navigation -->
      <div class="navbar__links">
        <a
          v-for="menu in itemMenu"
          :key="menu.page"
          class="navbar__link"
          :class="{ 'navbar__link--active': menu.active }"
          @click.prevent="navPage(menu.page, menu.parameter)"
          href="#"
        >
          <i :class="menu.iconClass"></i>
          <span>{{ menu.label }}</span>
        </a>
      </div>

      <!-- Center action -->
      <button class="navbar__sell-btn" @click="togglePopup" aria-label="Vendre">
        <i class="bi bi-plus-lg"></i>
        <span class="navbar__sell-text">Vendre</span>
      </button>

      <!-- Right section -->
      <div class="navbar__right">
        <!-- Notifications -->
        <div class="navbar__notif-wrapper" @click.stop="toggleNotifications">
          <button class="navbar__icon-btn" aria-label="Notifications">
            <i class="bi bi-bell"></i>
            <span v-if="unreadNotifications > 0" class="navbar__badge">{{ unreadNotifications > 9 ? '9+' : unreadNotifications }}</span>
          </button>
          <!-- Notifications dropdown -->
          <Transition name="dropdown">
            <div v-if="notificationsOpen" class="navbar__notif-dropdown" @click.stop>
              <div class="navbar__notif-header">
                <span class="navbar__notif-title">Notifications</span>
                <button v-if="notifications.length > 0" class="navbar__notif-mark-all" @click="markAllRead">Tout lire</button>
              </div>
              <div class="navbar__notif-list">
                <div v-if="notifications.length === 0" class="navbar__notif-empty">
                  <i class="bi bi-bell-slash"></i>
                  <span>Aucune notification</span>
                </div>
                <div v-for="notif in notifications" :key="notif._id" class="navbar__notif-item" :class="{ 'navbar__notif-item--unread': !notif.isRead }" @click="onNotifClick(notif)">
                  <i class="bi" :class="getNotifIcon(notif.type)"></i>
                  <div class="navbar__notif-content">
                    <span class="navbar__notif-text">{{ notif.content }}</span>
                    <span class="navbar__notif-time">{{ formatTime(notif.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Messages -->
        <button class="navbar__icon-btn" @click="navPage('messages', 'me')" aria-label="Messages">
          <i class="bi bi-chat-dots"></i>
        </button>

        <!-- Cart -->
        <button class="navbar__icon-btn" @click="navPage('cart', null)" aria-label="Panier">
          <i class="bi bi-cart3"></i>
          <span v-if="cartCount > 0" class="navbar__badge">{{ cartCount > 9 ? '9+' : cartCount }}</span>
        </button>

        <!-- Profile dropdown trigger -->
        <div class="navbar__profile" @click.stop="toggleDropdown">
          <div v-if="profilePicture" class="navbar__avatar" v-html="profilePicture"></div>
          <div v-else class="navbar__avatar navbar__avatar--placeholder">
            <i class="bi bi-person-fill"></i>
          </div>
          <i class="bi bi-chevron-down navbar__chevron" :class="{ 'navbar__chevron--open': dropdownOpen }"></i>
        </div>

        <!-- Profile Dropdown -->
        <Transition name="dropdown">
          <div v-if="dropdownOpen" class="navbar__dropdown" @click.stop>
            <div class="navbar__dropdown-header">
              <div v-if="profilePicture" class="navbar__dropdown-avatar" v-html="profilePicture"></div>
              <div v-else class="navbar__dropdown-avatar navbar__dropdown-avatar--placeholder">
                <i class="bi bi-person-fill"></i>
              </div>
              <div class="navbar__dropdown-info">
                <span class="navbar__dropdown-name">{{ dataUser.username || 'Utilisateur' }}</span>
                <span class="navbar__dropdown-sub">Mon compte</span>
              </div>
            </div>
            <div class="navbar__dropdown-divider"></div>
            <a @click="navPage('profile', 'me')" href="#" class="navbar__dropdown-item">
              <i class="bi bi-person"></i>
              Mon profil
            </a>
            <a @click="navPage('settings', null)" href="#" class="navbar__dropdown-item">
              <i class="bi bi-pencil-square"></i>
              Modifier mon profil
            </a>
            <a @click="navPage('collection', null)" href="#" class="navbar__dropdown-item">
              <i class="bi bi-collection"></i>
              Ma collection
            </a>
            <a @click="navPage('messages', 'me')" href="#" class="navbar__dropdown-item">
              <i class="bi bi-envelope"></i>
              Mes messages
            </a>
            <a @click="navPage('payments', null)" href="#" class="navbar__dropdown-item">
              <i class="bi bi-receipt"></i>
              Mes paiements
            </a>
            <a @click="navPage('disputes', null)" href="#" class="navbar__dropdown-item">
              <i class="bi bi-shield-exclamation"></i>
              Mes litiges
            </a>
            <a v-if="dataUser.role === 'admin'" @click="navPage('admin', null)" href="#" class="navbar__dropdown-item navbar__dropdown-item--admin">
              <i class="bi bi-shield-check"></i>
              Administration
            </a>
            <div class="navbar__dropdown-divider"></div>
            <a @click="logout" href="#" class="navbar__dropdown-item navbar__dropdown-item--danger">
              <i class="bi bi-box-arrow-right"></i>
              Déconnexion
            </a>
          </div>
        </Transition>
      </div>

      <!-- Mobile toggle -->
      <button class="navbar__toggle" @click="menuOpen = !menuOpen" aria-label="Menu">
        <span class="navbar__toggle-line"></span>
        <span class="navbar__toggle-line"></span>
        <span class="navbar__toggle-line"></span>
      </button>
    </div>

    <!-- Mobile menu -->
    <Transition name="slide-down">
      <div v-if="menuOpen" class="navbar__mobile">
        <!-- Mobile user info -->
        <div class="navbar__mobile-user">
          <div v-if="profilePicture" class="navbar__mobile-user-avatar" v-html="profilePicture"></div>
          <div v-else class="navbar__mobile-user-avatar navbar__mobile-user-avatar--placeholder">
            <i class="bi bi-person-fill"></i>
          </div>
          <span class="navbar__mobile-user-name">{{ dataUser.username || 'Utilisateur' }}</span>
        </div>
        <div class="navbar__dropdown-divider"></div>
        <a
          v-for="menu in itemMenu"
          :key="menu.page"
          class="navbar__mobile-link"
          :class="{ 'navbar__mobile-link--active': menu.active }"
          @click.prevent="navPage(menu.page, menu.parameter)"
          href="#"
        >
          <i :class="menu.iconClass"></i>
          <span>{{ menu.label }}</span>
        </a>
        <button class="btn btn-primary w-full mt-md" @click="togglePopup">
          <i class="bi bi-plus-lg"></i>
          Vendre un article
        </button>
        <div class="navbar__dropdown-divider"></div>
        <a @click="navPage('profile', 'me')" href="#" class="navbar__mobile-link">
          <i class="bi bi-person"></i>
          <span>Mon profil</span>
        </a>
        <a @click="navPage('collection', null)" href="#" class="navbar__mobile-link">
          <i class="bi bi-collection"></i>
          <span>Ma collection</span>
        </a>
        <a @click="navPage('payments', null)" href="#" class="navbar__mobile-link">
          <i class="bi bi-receipt"></i>
          <span>Mes paiements</span>
        </a>
        <a @click="navPage('disputes', null)" href="#" class="navbar__mobile-link">
          <i class="bi bi-shield-exclamation"></i>
          <span>Mes litiges</span>
        </a>
        <a @click="logout" href="#" class="navbar__mobile-link navbar__mobile-link--danger">
          <i class="bi bi-box-arrow-right"></i>
          <span>Déconnexion</span>
        </a>
      </div>
    </Transition>
  </nav>
</template>

<script lang="ts">
import { useRoute, useRouter, type RouteRecordNameGeneric } from 'vue-router';
import userService from '@/services/user.service';
import authentificationService from '@/services/authentification.service';
import notificationService from '@/services/notification.service';
import cartService from '@/services/cart.service';
import eventBus from '@/eventBus';
import type { ImgUserProfile, IUser } from '@/types/user.types';

declare global {
  interface Window {
    $func?: {
      logout?: () => void;
    };
  }
}

    export default {
        name: "nav_bar",
        data() {
            return {
                dropdownOpen: false,
                notificationsOpen: false,
                menuOpen: false,
                currentRoute: '',
                htmlImgProfile: '',
                unreadNotifications: 0,
                notifications: [] as any[],
                cartCount: 0,
                itemMenu: [
                    {
                    label: 'Accueil',
                    iconClass: 'bi bi-house',
                    active: this.verifBtn('dashboard'),
                    page: 'dashboard',
                    parameter: null
                    },
                    {
                    label: 'Rechercher',
                    iconClass: 'bi bi-search',
                    active: this.verifBtn('searchList'),
                    page: 'searchList',
                    parameter: null
                    },
                    {
                      label: 'Contact',
                      iconClass: 'bi bi-headset',
                      active: this.verifBtn('contact'),
                      page: 'contact',
                      parameter: null
                    }
                ],
                itemMenuEnd: [
                    {},{},{},{}
                ],
                dataUser: {} as IUser,
                showFullMenu:false
            };
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const id = route.params.id;
            return { route, router, id };
        },
        mounted() {
          if(this.htmlImgProfile != ''){
            return this.htmlImgProfile;
          }else{
            userService.getMyInformation().then((data: any) => {
              this.dataUser = data.profile as IUser;
              if(this.dataUser){
                const profileImgInfo : ImgUserProfile = {
                  username: this.dataUser.username,
                  profilePicture: this.dataUser.profilePicture
                };
                this.htmlImgProfile = userService.renderUserAvatar(profileImgInfo);
              }else{
                return false;
              }
            }).catch((error) => {
              console.error('Error fetching user information:', error);
              return false;
            });
          }
          window.addEventListener('click', this.handleWindowClick);
          this.fetchNotifications();
          this.fetchCartCount();
          eventBus.on('cart:updated', this.fetchCartCount);
        },
        beforeUnmount() {
            window.removeEventListener('click', this.handleWindowClick);
            eventBus.off('cart:updated', this.fetchCartCount);
        },
        computed: {
          profilePicture() {
            return this.htmlImgProfile;
          },
        },
        methods: {
            handleWindowClick(event: MouseEvent) {
                if (this.dropdownOpen) {
                    const dropdown = this.$el.querySelector('.navbar__dropdown');
                    const profile = this.$el.querySelector('.navbar__profile');
                    if (
                        dropdown && !dropdown.contains(event.target as Node) &&
                        profile && !profile.contains(event.target as Node)
                    ) {
                        this.dropdownOpen = false;
                    }
                }
                if (this.notificationsOpen) {
                    const notifDropdown = this.$el.querySelector('.navbar__notif-dropdown');
                    const notifWrapper = this.$el.querySelector('.navbar__notif-wrapper');
                    if (
                        notifDropdown && !notifDropdown.contains(event.target as Node) &&
                        notifWrapper && !notifWrapper.contains(event.target as Node)
                    ) {
                        this.notificationsOpen = false;
                    }
                }
            },
            verifBtn(btn:RouteRecordNameGeneric){
                if(this.route.name == 'messages-list' && btn === 'messages') return true;
                if(this.route.name == btn){
                    if (btn === 'profile') {
                        return this.route.params?.id === 'me' || this.route.params?.parameter === 'me';
                    }
                    return true;
                }
                return false;
            },
            navPage(page:RouteRecordNameGeneric, parameter: string | null){
                this.menuOpen = false;
                this.dropdownOpen = false;
                setTimeout(() => {
                    const route: any = { name: page };
                    if (parameter) route.params = { id: parameter };
                    this.router.push(route);
                }, 0);
            },
            togglePopup() {
                this.router.push({ name: 'add_post' });
            },
            toggleDropdown() {
              this.dropdownOpen = !this.dropdownOpen;
              if (this.dropdownOpen) this.notificationsOpen = false;
            },
            toggleNotifications() {
              this.notificationsOpen = !this.notificationsOpen;
              if (this.notificationsOpen) this.dropdownOpen = false;
            },
            async markAllRead() {
              try {
                await notificationService.markAllAsRead();
                this.notifications.forEach((n: any) => n.isRead = true);
                this.unreadNotifications = 0;
              } catch { /* ignore */ }
            },
            onNotifClick(notif: any) {
              if (!notif.isRead) {
                notificationService.markAsRead(notif._id).catch(() => {});
                notif.isRead = true;
                this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
              }
              this.notificationsOpen = false;
            },
            getNotifIcon(type: string) {
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
            },
            formatTime(dateStr: string) {
              if (!dateStr) return '';
              const diff = Date.now() - new Date(dateStr).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 1) return "À l'instant";
              if (mins < 60) return `${mins} min`;
              const hours = Math.floor(mins / 60);
              if (hours < 24) return `${hours}h`;
              const days = Math.floor(hours / 24);
              if (days < 7) return `${days}j`;
              if (days < 30) return `${Math.floor(days / 7)} sem.`;
              if (days < 365) return `${Math.floor(days / 30)} mois`;
              return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            },
            async fetchNotifications() {
              try {
                const data = await notificationService.getNotifications();
                this.unreadNotifications = data.pagination?.unreadCount || 0;
                this.notifications = data.notifications || [];
              } catch {
                // silently fail
              }
            },
            async fetchCartCount() {
              try {
                const cart = await cartService.getCart();
                this.cartCount = cart.items?.length || 0;
              } catch {
                // silently fail
              }
            },
            logout() {
              authentificationService.logout()
            },
        },
    };
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

  &--active {
    color: var(--accent-pink) !important;
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

.navbar__profile {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 4px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;

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

.navbar__dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 12px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
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
  padding: 14px 16px;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
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
  .navbar__icon-btn {
    display: none;
  }

  .navbar__sell-btn {
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
    display: none !important;
  }
}
</style>
