<template>
  <main class="page my-reports">
    <div class="my-reports__container">
      <h1 class="my-reports__title">Mes signalements</h1>
      <p class="my-reports__intro">
        Retrouvez ici les contenus que vous avez signalés et l'avancement de leur examen par l'équipe de modération.
      </p>

      <p v-if="loading && reports.length === 0" class="my-reports__empty">Chargement…</p>
      <p v-else-if="loadFailed" class="my-reports__empty">Impossible de charger vos signalements.</p>
      <div v-else-if="reports.length === 0" class="my-reports__empty">
        <i class="bi bi-flag"></i>
        <p>Vous n'avez encore rien signalé.</p>
      </div>

      <ul v-else class="my-reports__list">
        <li v-for="report in reports" :key="report._id" class="my-reports__item">
          <div class="my-reports__head">
            <span class="my-reports__target">{{ TARGET_LABELS[report.targetType] || report.targetType }}</span>
            <span class="my-reports__status" :class="`my-reports__status--${report.status}`">
              {{ STATUS_LABELS[report.status] || report.status }}
            </span>
          </div>
          <p class="my-reports__reason">{{ REASON_LABELS[report.reason] || report.reason }}</p>
          <p v-if="report.details" class="my-reports__details">{{ report.details }}</p>
          <time class="my-reports__date" :datetime="report.createdAt">Signalé le {{ formatDate(report.createdAt, 'long') }}</time>
        </li>
      </ul>

      <nav v-if="totalPages > 1" class="my-reports__pagination" aria-label="Pages de signalements">
        <button type="button" :disabled="page <= 1 || loading" @click="load(page - 1)">Précédent</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button type="button" :disabled="page >= totalPages || loading" @click="load(page + 1)">Suivant</button>
      </nav>
    </div>
  </main>
</template>

<script setup lang="ts">
/** Page « Mes signalements » : les signalements de l'utilisateur et leur statut de traitement. */
import { onMounted, ref } from 'vue';
import reportService, { type Report, type ReportStatus, type ReportTargetType } from '@/services/report.service';
import { formatDate } from '@/utils/format';

defineOptions({ name: 'MyReportsPage' });

const TARGET_LABELS: Record<ReportTargetType, string> = {
  product: 'Annonce',
  rating: 'Avis',
  user: 'Profil',
  post: 'Publication',
  message: 'Message'
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'En attente',
  reviewed: 'En cours d\'examen',
  resolved: 'Traité',
  rejected: 'Non retenu'
};

const REASON_LABELS: Record<string, string> = {
  inappropriate_content: 'Contenu inapproprié',
  offensive_language: 'Langage offensant',
  false_information: 'Fausses informations',
  spam: 'Spam',
  fraud: 'Fraude / Arnaque',
  copyright_violation: 'Violation du droit d\'auteur',
  other: 'Autre raison'
};

const reports = ref<Report[]>([]);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const loadFailed = ref(false);

async function load(target: number) {
  loading.value = true;
  loadFailed.value = false;
  try {
    const result = await reportService.getMyReports(target);
    reports.value = result.reports;
    page.value = result.pagination.page;
    totalPages.value = result.pagination.pages;
  } catch {
    // Un 401 a déjà redirigé vers /login ; sinon on affiche l'échec dans la page.
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => load(1));
</script>

<style lang="scss" scoped>
.my-reports__container {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--space-xl, 24px) var(--space-md, 16px);
}

.my-reports__title {
  margin: 0 0 var(--space-xs, 4px);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.my-reports__intro {
  margin: 0 0 var(--space-lg, 16px);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.my-reports__empty {
  text-align: center;
  color: var(--text-muted);

  i { font-size: 2rem; }
}

.my-reports__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm, 8px);
}

.my-reports__item {
  padding: var(--space-md, 12px) var(--space-lg, 16px);
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg, 12px);
}

.my-reports__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm, 8px);
}

.my-reports__target {
  font-weight: 700;
  color: var(--text-primary);
}

.my-reports__status {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: var(--surface-hover);
  color: var(--text-secondary);

  &--pending { background: var(--warning-light); color: var(--warning-text); }
  &--reviewed { background: var(--info-light); color: var(--info-text); }
  &--resolved { background: var(--success-light); color: var(--success-text); }
}

.my-reports__reason {
  margin: var(--space-xs, 4px) 0 0;
  color: var(--text-secondary);
}

.my-reports__details {
  margin: var(--space-xs, 4px) 0 0;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  white-space: pre-wrap;
}

.my-reports__date {
  display: block;
  margin-top: var(--space-xs, 4px);
  color: var(--text-muted);
  font-size: var(--font-size-xs);
}

.my-reports__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-md, 12px);
  margin-top: var(--space-lg, 16px);
}
</style>
