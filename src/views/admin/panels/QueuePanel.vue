<template>
  <div class="admin__panel">
    <div class="admin__panel-header">
      <h2>{{ queue.total }} élément{{ queue.total > 1 ? 's' : '' }} en attente</h2>
      <div class="admin__toolbar">
        <span v-if="queue.oldestWaitingSince" class="admin__badge" :class="oldestBadgeClass">
          <i class="bi bi-clock-history"></i>
          Plus ancien : {{ formatAge(queue.oldestWaitingSince) }}
        </span>
        <button type="button" class="admin__btn" :disabled="loading" @click="load">
          <i class="bi bi-arrow-clockwise"></i> Actualiser
        </button>
      </div>
    </div>

    <div v-if="queue.total > 0" class="admin__panel-body" style="padding-bottom: 0">
      <div class="admin__kpis">
        <button
          v-for="source in SOURCES"
          :key="source.kind"
          type="button"
          class="admin__kpi"
          :class="`admin__kpi--${source.tone}`"
          style="cursor: pointer; text-align: left"
          @click="$emit('navigate', source.tab)"
        >
          <i :class="source.icon"></i>
          <span class="admin__kpi-body">
            <span class="admin__kpi-value">{{ queue.counts[source.kind] || 0 }}</span>
            <span class="admin__kpi-label">{{ source.label }}</span>
          </span>
        </button>
      </div>
    </div>

    <div v-if="loading && queue.items.length === 0" class="admin__empty">
      <i class="bi bi-hourglass-split"></i>
      <p>Chargement de la file…</p>
    </div>

    <div v-else-if="queue.items.length === 0" class="admin__empty">
      <i class="bi bi-check2-circle"></i>
      <p>Rien à traiter. Tout est à jour.</p>
    </div>

    <div v-else class="admin__queue" style="margin-top: var(--space-md)">
      <div
        v-for="item in queue.items"
        :key="`${item.kind}-${item.id}`"
        class="admin__queue-item"
        :class="`admin__queue-item--${item.kind}`"
        role="button"
        tabindex="0"
        @click="$emit('navigate', item.tab)"
        @keydown.enter="$emit('navigate', item.tab)"
      >
        <span class="admin__queue-icon">
          <i :class="SOURCE_BY_KIND[item.kind]?.icon || 'bi bi-dot'"></i>
        </span>
        <span class="admin__queue-body">
          <span class="admin__queue-label">{{ item.label }}</span>
          <span class="admin__queue-detail">{{ item.subject }} — {{ item.detail }}</span>
        </span>
        <span class="admin__queue-age">
          en attente<br />
          <strong>{{ formatAge(item.waitingSince) }}</strong>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onMounted, ref } from 'vue';
  import adminService from '@/services/admin.service';
  import { func } from '@/function';
  import { apiErrorMessage, formatAge } from '../adminFormat';

  const STALE_QUEUE_DAYS = 3;

  const SOURCES = [
    { kind: 'report', label: 'Signalements', icon: 'bi bi-flag', tone: 'warning', tab: 'reports' },
    { kind: 'dispute', label: 'Litiges', icon: 'bi bi-shield-exclamation', tone: 'danger', tab: 'disputes' },
    { kind: 'verification', label: 'Vérifications', icon: 'bi bi-patch-check', tone: 'info', tab: 'verifications' },
    { kind: 'deletion', label: 'Suppressions', icon: 'bi bi-person-dash', tone: 'accent', tab: 'rgpd' }
  ] as const;

  const SOURCE_BY_KIND = SOURCES.reduce(
    (acc, source) => ({ ...acc, [source.kind]: source }),
    {} as Record<string, (typeof SOURCES)[number]>
  );

  export default defineComponent({
    name: 'QueuePanel',
    emits: ['navigate', 'changed'],
    setup() {
      const queue = ref<any>({ items: [], counts: {}, total: 0, oldestWaitingSince: null });
      const loading = ref(false);

      const oldestBadgeClass = computed(() => {
        if (!queue.value.oldestWaitingSince) return 'admin__badge--success';
        const ageDays = (Date.now() - new Date(queue.value.oldestWaitingSince).getTime()) / 86400000;
        return ageDays > STALE_QUEUE_DAYS ? 'admin__badge--danger' : 'admin__badge--warning';
      });

      const load = async () => {
        loading.value = true;
        try {
          queue.value = await adminService.getQueue();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger la file d\'attente'));
        } finally {
          loading.value = false;
        }
      };

      onMounted(load);

      return { SOURCES, SOURCE_BY_KIND, queue, loading, oldestBadgeClass, formatAge, load };
    }
  });
</script>
