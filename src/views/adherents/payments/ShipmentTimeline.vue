<template>
  <ol v-if="timeline.length" class="shipment-timeline">
    <li v-for="(event, index) in timeline" :key="index" :class="['timeline-item', `timeline-item--${event.status}`]">
      <span class="timeline-dot" aria-hidden="true"><i :class="timelineIcon(event.status)"></i></span>
      <div class="timeline-body">
        <div class="timeline-title">{{ timelineLabel(event.status) }}</div>
        <div v-if="event.description" class="timeline-desc">{{ event.description }}</div>
        <small>
          {{ formatDateTime(event.occurredAt) }}
          <span v-if="event.location"> · {{ event.location }}</span>
          <span class="timeline-source">· {{ sourceLabel(event.source) }}</span>
        </small>
      </div>
    </li>
  </ol>
</template>

<script setup lang="ts">
/** Étapes du suivi d'un colis, de la plus ancienne à la plus récente. */
import { computed } from 'vue';
import { formatDateTime } from '@/utils/format';
import { sourceLabel, timelineIcon, timelineLabel } from './paymentLabels';
import type { ShipmentEvent } from './types';

const props = defineProps<{ events: ShipmentEvent[] }>();

// Liste recalculée à chaque rendu et jamais éditée : l'index suffit comme clé.
const timeline = computed(() =>
  [...props.events].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
);
</script>
