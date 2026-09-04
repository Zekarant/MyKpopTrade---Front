<template>
  <div class="admin__chart">
    <div class="admin__chart-head">
      <span class="admin__chart-title">{{ title }}</span>
      <span class="admin__chart-total">{{ formattedTotal }}</span>
    </div>

    <svg
      class="admin__chart-svg"
      :viewBox="`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`"
      preserveAspectRatio="none"
      role="img"
      :aria-label="`${title} : ${formattedTotal} sur la période`"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.28" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <line
        x1="0"
        :y1="VIEWBOX_HEIGHT / 2"
        :x2="VIEWBOX_WIDTH"
        :y2="VIEWBOX_HEIGHT / 2"
        stroke="currentColor"
        stroke-opacity="0.12"
        stroke-dasharray="3 4"
        vector-effect="non-scaling-stroke"
      />

      <path :d="areaPath" :fill="`url(#${gradientId})`" />
      <path
        :d="linePath"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
      <circle
        v-if="lastPoint"
        :cx="lastPoint.x"
        :cy="lastPoint.y"
        r="2.5"
        :fill="color"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <div class="admin__chart-axis">
      <span>{{ firstLabel }}</span>
      <span>{{ lastLabel }}</span>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, type PropType } from 'vue';

  const VIEWBOX_WIDTH = 300;
  const VIEWBOX_HEIGHT = 72;
  const PADDING_Y = 6;

  let gradientCounter = 0;

  export default defineComponent({
    name: 'AdminSparkline',
    props: {
      title: { type: String, required: true },
      values: { type: Array as PropType<number[]>, required: true },
      labels: { type: Array as PropType<string[]>, default: () => [] },
      color: { type: String, default: 'var(--accent-pink)' },
      total: { type: Number, default: undefined },
      isCurrency: { type: Boolean, default: false }
    },
    setup(props) {
      const gradientId = `admin-spark-${++gradientCounter}`;

      const points = computed(() => {
        const values = props.values;
        if (values.length === 0) return [];

        const max = Math.max(...values, 1);
        const usableHeight = VIEWBOX_HEIGHT - PADDING_Y * 2;
        const step = values.length > 1 ? VIEWBOX_WIDTH / (values.length - 1) : 0;

        return values.map((value, index) => ({
          x: values.length > 1 ? index * step : VIEWBOX_WIDTH / 2,
          y: VIEWBOX_HEIGHT - PADDING_Y - (value / max) * usableHeight
        }));
      });

      const linePath = computed(() =>
        points.value.length === 0
          ? ''
          : points.value
              .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
              .join(' ')
      );

      const areaPath = computed(() => {
        if (points.value.length === 0) return '';
        const first = points.value[0];
        const last = points.value[points.value.length - 1];
        return `${linePath.value} L${last.x.toFixed(2)},${VIEWBOX_HEIGHT} L${first.x.toFixed(2)},${VIEWBOX_HEIGHT} Z`;
      });

      const lastPoint = computed(() => points.value[points.value.length - 1] ?? null);

      const formattedTotal = computed(() => {
        const value = props.total ?? props.values.reduce((sum, entry) => sum + entry, 0);
        return props.isCurrency ? `${value.toFixed(2)} €` : String(value);
      });

      const shortDay = (isoDate?: string): string =>
        !isoDate
          ? ''
          : new Date(isoDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

      return {
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT,
        gradientId,
        linePath,
        areaPath,
        lastPoint,
        formattedTotal,
        firstLabel: computed(() => shortDay(props.labels[0])),
        lastLabel: computed(() => shortDay(props.labels[props.labels.length - 1]))
      };
    }
  });
</script>
