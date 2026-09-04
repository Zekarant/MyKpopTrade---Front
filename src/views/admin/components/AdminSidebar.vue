<template>
  <aside class="admin__sidebar">
    <div class="admin__brand">
      <i class="bi bi-shield-check"></i>
      <span>Administration</span>
    </div>

    <nav class="admin__nav" aria-label="Sections d'administration">
      <div v-for="(group, index) in nav" :key="group.title || index" class="admin__nav-group">
        <span v-if="group.title" class="admin__nav-title">{{ group.title }}</span>
        <button
          v-for="item in group.items"
          :key="item.id"
          type="button"
          class="admin__nav-item"
          :class="{ 'admin__nav-item--active': item.id === activeTab }"
          :aria-current="item.id === activeTab ? 'page' : undefined"
          @click="$emit('select', item.id)"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
          <span v-if="badgeFor(item)" class="admin__nav-badge">{{ badgeFor(item) }}</span>
        </button>
      </div>
    </nav>
  </aside>
</template>

<script lang="ts">
  import { defineComponent, type PropType } from 'vue';
  import { ADMIN_NAV, type AdminSection } from '../adminSections';

  export default defineComponent({
    name: 'AdminSidebar',
    props: {
      activeTab: { type: String, required: true },
      counts: { type: Object as PropType<Record<string, number>>, default: () => ({}) }
    },
    emits: ['select'],
    setup(props) {
      const badgeFor = (item: AdminSection): number | null => {
        if (!item.badgeKey) return null;
        return props.counts[item.badgeKey] || null;
      };

      return { nav: ADMIN_NAV, badgeFor };
    }
  });
</script>
