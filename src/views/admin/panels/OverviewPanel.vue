<template>
  <div style="display: flex; flex-direction: column; gap: var(--space-md)">
    <div class="admin__panel">
      <div class="admin__panel-header">
        <h2>Activité sur {{ days }} jours</h2>
      </div>
      <div class="admin__panel-body">
        <div v-if="loading" class="admin__empty admin__empty--inline">
          <i class="bi bi-hourglass-split"></i>
          <p>Chargement des courbes…</p>
        </div>
        <div v-else class="admin__charts">
          <AdminSparkline
            title="Inscriptions"
            :values="series.map((point) => point.signups)"
            :labels="labels"
            color="var(--accent-pink)"
          />
          <AdminSparkline
            title="Annonces publiées"
            :values="series.map((point) => point.listings)"
            :labels="labels"
            color="var(--accent-purple)"
          />
          <AdminSparkline
            title="Ventes"
            :values="series.map((point) => point.sales)"
            :labels="labels"
            color="var(--success)"
          />
          <AdminSparkline
            title="Chiffre d'affaires"
            :values="series.map((point) => point.revenue)"
            :labels="labels"
            color="var(--info)"
            is-currency
          />
          <AdminSparkline
            title="Signalements reçus"
            :values="series.map((point) => point.reports)"
            :labels="labels"
            color="var(--warning)"
          />
        </div>
      </div>
    </div>

    <div class="admin__panel">
      <div class="admin__panel-header">
        <h2>Répartition</h2>
      </div>
      <div class="admin__panel-body">
        <div class="admin__panel-grid">
          <div class="admin__card">
            <h3><i class="bi bi-pie-chart"></i> Produits par type</h3>
            <dl class="admin__definition-list">
              <div
                v-for="(count, type) in productStats.typeDistribution"
                :key="type"
                class="admin__definition"
              >
                <dt>{{ PRODUCT_TYPE_LABELS[type] || type }}</dt>
                <dd>{{ count }}</dd>
              </div>
              <div v-if="!hasTypeDistribution" class="admin__definition">
                <dt class="admin__muted">Aucun produit</dt>
                <dd>0</dd>
              </div>
            </dl>
          </div>

          <div class="admin__card">
            <h3><i class="bi bi-box-seam"></i> Catalogue</h3>
            <dl class="admin__definition-list">
              <div class="admin__definition">
                <dt>Disponibles</dt>
                <dd>{{ productStats.available }}</dd>
              </div>
              <div class="admin__definition">
                <dt>Vendus</dt>
                <dd>{{ productStats.sold }}</dd>
              </div>
              <div class="admin__definition">
                <dt>Nouveaux (7 j)</dt>
                <dd>{{ productStats.newProducts }}</dd>
              </div>
            </dl>
          </div>

          <div class="admin__card">
            <h3><i class="bi bi-people-fill"></i> Comptes</h3>
            <dl class="admin__definition-list">
              <div class="admin__definition">
                <dt>Total</dt>
                <dd>{{ stats.totalUsers }}</dd>
              </div>
              <div class="admin__definition">
                <dt>Actifs</dt>
                <dd>{{ stats.activeUsers }}</dd>
              </div>
              <div class="admin__definition">
                <dt>Suspendus</dt>
                <dd>{{ stats.suspendedUsers }}</dd>
              </div>
              <div class="admin__definition">
                <dt>Nouveaux (30 j)</dt>
                <dd>{{ stats.newUsers }}</dd>
              </div>
            </dl>
          </div>

          <div class="admin__card">
            <h3><i class="bi bi-currency-euro"></i> Volume cumulé</h3>
            <dl class="admin__definition-list">
              <div class="admin__definition">
                <dt>Ventes réalisées</dt>
                <dd>{{ productStats.sold }}</dd>
              </div>
              <div class="admin__definition">
                <dt>Ventes récentes (30 j)</dt>
                <dd>{{ productStats.recentSales }}</dd>
              </div>
              <div class="admin__definition">
                <dt>Volume total</dt>
                <dd>{{ formatPrice(productStats.totalRevenue) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import adminService from '@/services/admin.service';
import { func } from '@/function';
import AdminSparkline from '../components/AdminSparkline.vue';
import { PRODUCT_TYPE_LABELS, apiErrorMessage, formatPrice } from '../adminFormat';
import type { AdminProductStats, AdminTimeseriesPoint, AdminUserStats } from '../types';

const DEFAULT_DAYS = 30;

const props = defineProps<{
  stats: AdminUserStats;
  productStats: AdminProductStats;
}>();

const series = ref<AdminTimeseriesPoint[]>([]);
const days = ref(DEFAULT_DAYS);
const loading = ref(true);

const labels = computed(() => series.value.map((point) => point.date));
const hasTypeDistribution = computed(() => Object.keys(props.productStats.typeDistribution || {}).length > 0);

const load = async () => {
  loading.value = true;
  try {
    const data = await adminService.getStatsTimeseries();
    series.value = data.series || [];
    days.value = data.days || DEFAULT_DAYS;
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'Impossible de charger les courbes'));
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>
