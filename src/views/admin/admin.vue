<template>
  <main class="page">
    <div class="admin">
      <AdminSidebar :active-tab="currentTab" :counts="queueCounts" @select="switchTab" />

      <section class="admin__main">
        <header class="admin__topbar">
          <div>
            <h1 class="admin__topbar-title">{{ section.title }}</h1>
            <p class="admin__topbar-subtitle">{{ section.subtitle }}</p>
          </div>
          <div class="admin__topbar-actions">
            <span v-if="queueCounts.total" class="admin__badge admin__badge--warning">
              <i class="bi bi-inbox"></i> {{ queueCounts.total }} en attente
            </span>
            <span v-else class="admin__badge admin__badge--success">
              <i class="bi bi-check2"></i> File vide
            </span>
            <button type="button" class="admin__btn" @click="paletteOpen = true">
              <i class="bi bi-search"></i> Rechercher
              <kbd class="admin__kbd">{{ shortcutHint }}</kbd>
            </button>
          </div>
        </header>

        <div class="admin__kpis">
          <button type="button" class="admin__kpi" @click="goTo('users')">
            <i class="bi bi-people"></i>
            <span class="admin__kpi-body">
              <span class="admin__kpi-value">{{ stats.totalUsers }}</span>
              <span class="admin__kpi-label">Utilisateurs</span>
            </span>
          </button>
          <button type="button" class="admin__kpi admin__kpi--info" @click="goTo('users')">
            <i class="bi bi-person-plus"></i>
            <span class="admin__kpi-body">
              <span class="admin__kpi-value">{{ stats.newUsers }}</span>
              <span class="admin__kpi-label">Nouveaux (30 j)</span>
            </span>
          </button>
          <button type="button" class="admin__kpi" @click="goTo('products')">
            <i class="bi bi-box-seam"></i>
            <span class="admin__kpi-body">
              <span class="admin__kpi-value">{{ productStats.total }}</span>
              <span class="admin__kpi-label">Annonces</span>
            </span>
          </button>
          <button
            type="button"
            class="admin__kpi admin__kpi--success"
            @click="goTo('products', { status: 'sold' })"
          >
            <i class="bi bi-cart-check"></i>
            <span class="admin__kpi-body">
              <span class="admin__kpi-value">{{ productStats.sold }}</span>
              <span class="admin__kpi-label">Vendues</span>
            </span>
          </button>
          <button
            type="button"
            class="admin__kpi admin__kpi--success"
            @click="goTo('products', { status: 'sold' })"
          >
            <i class="bi bi-currency-euro"></i>
            <span class="admin__kpi-body">
              <span class="admin__kpi-value">{{ formatPrice(productStats.totalRevenue) }}</span>
              <span class="admin__kpi-label">Volume total</span>
            </span>
          </button>
          <button
            type="button"
            class="admin__kpi admin__kpi--danger"
            @click="goTo('users', { status: 'suspended' })"
          >
            <i class="bi bi-person-x"></i>
            <span class="admin__kpi-body">
              <span class="admin__kpi-value">{{ stats.suspendedUsers }}</span>
              <span class="admin__kpi-label">Suspendus</span>
            </span>
          </button>
          <button type="button" class="admin__kpi admin__kpi--danger" @click="goTo('suspended')">
            <i class="bi bi-shield-x"></i>
            <span class="admin__kpi-body">
              <span class="admin__kpi-value">{{ productStats.suspended }}</span>
              <span class="admin__kpi-label">Articles suspendus</span>
            </span>
          </button>
        </div>

        <component
          :is="activePanel"
          :key="panelKey"
          v-bind="panelProps"
          @changed="loadCounters"
          @navigate="switchTab"
        />
      </section>
    </div>

    <AdminCommandPalette
      v-if="paletteOpen"
      @close="paletteOpen = false"
      @navigate="onPaletteNavigate"
    />
  </main>
</template>

<script lang="ts">
  import { computed, defineAsyncComponent, defineComponent, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import authentificationService from '@/services/authentification.service';
  import adminService from '@/services/admin.service';
  import AdminCommandPalette from './components/AdminCommandPalette.vue';
  import AdminSidebar from './components/AdminSidebar.vue';
  import { ADMIN_SECTIONS, DEFAULT_ADMIN_TAB } from './adminSections';
  import { formatPrice } from './adminFormat';
  import type { AdminProductStats, AdminQueue, AdminUserStats } from './types';

  // Un seul panneau est affiché à la fois : chacun devient son propre chunk,
  // chargé à la première ouverture de l'onglet, au lieu de tout embarquer dans
  // le chunk de la vue admin. defineAsyncComponent met le chargement en cache.
  const PANELS: Record<string, Component> = {
    queue: defineAsyncComponent(() => import('./panels/QueuePanel.vue')),
    overview: defineAsyncComponent(() => import('./panels/OverviewPanel.vue')),
    reports: defineAsyncComponent(() => import('./panels/ReportsPanel.vue')),
    disputes: defineAsyncComponent(() => import('./panels/DisputesPanel.vue')),
    moderation: defineAsyncComponent(() => import('./panels/ModerationPanel.vue')),
    verifications: defineAsyncComponent(() => import('./panels/VerificationsPanel.vue')),
    products: defineAsyncComponent(() => import('./panels/ProductsPanel.vue')),
    suspended: defineAsyncComponent(() => import('./panels/SuspendedProductsPanel.vue')),
    kpop: defineAsyncComponent(() => import('./panels/KpopPanel.vue')),
    users: defineAsyncComponent(() => import('./panels/UsersPanel.vue')),
    rgpd: defineAsyncComponent(() => import('./panels/RgpdPanel.vue')),
    faq: defineAsyncComponent(() => import('./panels/FaqPanel.vue')),
    audit: defineAsyncComponent(() => import('./panels/AuditPanel.vue'))
  };

  export default defineComponent({
    name: 'AdminView',
    components: { AdminCommandPalette, AdminSidebar },
    setup() {
      const route = useRoute();
      const router = useRouter();

      const currentTab = ref(DEFAULT_ADMIN_TAB);
      const stats = ref<AdminUserStats>({ totalUsers: 0, newUsers: 0, suspendedUsers: 0, activeUsers: 0 });
      const productStats = ref<AdminProductStats>({
        total: 0,
        available: 0,
        sold: 0,
        suspended: 0,
        newProducts: 0,
        recentSales: 0,
        totalRevenue: 0,
        typeDistribution: {}
      });
      const queueCounts = ref<Record<string, number>>({ total: 0 });
      const paletteOpen = ref(false);
      const remountToken = ref(0);

      const section = computed(() => ADMIN_SECTIONS[currentTab.value] ?? ADMIN_SECTIONS[DEFAULT_ADMIN_TAB]);
      const activePanel = computed(() => PANELS[currentTab.value] ?? PANELS[DEFAULT_ADMIN_TAB]);
      const panelKey = computed(() => `${currentTab.value}:${remountToken.value}`);

      const shortcutHint = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
        ? '⌘K'
        : 'Ctrl+K';

      const panelProps = computed(() =>
        currentTab.value === 'overview'
          ? { stats: stats.value, productStats: productStats.value }
          : {}
      );

      const switchTab = (tabId: string) => {
        if (!PANELS[tabId] || tabId === currentTab.value) return;
        currentTab.value = tabId;
        router.replace({ query: { tab: tabId } });
      };

      const goTo = (tabId: string, query: Record<string, string> = {}) => {
        if (!PANELS[tabId]) return;
        currentTab.value = tabId;
        router.replace({ query: { tab: tabId, ...query } });
        remountToken.value += 1;
      };

      const applyTabFromRoute = () => {
        const requested = route.query.tab;
        const tabId = Array.isArray(requested) ? requested[0] : requested;
        if (typeof tabId === 'string' && PANELS[tabId]) {
          currentTab.value = tabId;
        }
      };

      const onPaletteNavigate = ({ tab, search }: { tab: string; search?: string }) => {
        if (!PANELS[tab]) return;
        currentTab.value = tab;
        router.replace({ query: search ? { tab, search } : { tab } });
        remountToken.value += 1;
      };

      const loadCounters = async () => {
        const [queue, userStats, catalogStats] = await Promise.allSettled<
          [Promise<AdminQueue>, Promise<AdminUserStats>, Promise<AdminProductStats>]
        >([
          adminService.getQueue(),
          adminService.getStats(),
          adminService.getProductStats()
        ]);

        if (queue.status === 'fulfilled') {
          queueCounts.value = { ...queue.value.counts, total: queue.value.total };
        }
        if (userStats.status === 'fulfilled') {
          stats.value = userStats.value;
        }
        if (catalogStats.status === 'fulfilled') {
          productStats.value = catalogStats.value;
        }
      };

      watch(() => route.query.tab, applyTabFromRoute);

      const onKeydown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          paletteOpen.value = true;
        }
      };

      onMounted(async () => {
        window.addEventListener('keydown', onKeydown);

        try {
          await authentificationService.verifSession();
        } catch {
          router.push({ name: 'login' });
          return;
        }

        applyTabFromRoute();
        await loadCounters();
      });

      onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

      return {
        currentTab,
        stats,
        productStats,
        queueCounts,
        paletteOpen,
        section,
        activePanel,
        panelKey,
        panelProps,
        shortcutHint,
        switchTab,
        goTo,
        onPaletteNavigate,
        loadCounters,
        formatPrice
      };
    }
  });
</script>

<style lang="scss">
  @use '@/css/admin.scss';
</style>
