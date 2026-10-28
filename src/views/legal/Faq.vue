<template>
  <main class="faq-page" :class="{ 'faq-page--guest': !isAuthenticated }">
    <div class="faq-page__container">
      <header class="faq-page__header">
        <router-link v-if="!isAuthenticated" to="/" class="faq-page__back">
          <i class="bi bi-arrow-left"></i> Retour à l'accueil
        </router-link>
        <h1>Questions fréquentes</h1>
      </header>

      <div v-if="loading" class="faq-page__state">
        <p>Chargement…</p>
      </div>
      <div v-else-if="error" class="faq-page__state">
        <p>{{ error }}</p>
      </div>
      <div v-else-if="groups.length === 0" class="faq-page__state">
        <p>Aucune question pour le moment.</p>
      </div>

      <article v-else class="faq-page__content">
        <section v-for="group in groups" :key="group.category" class="faq-category">
          <h2 class="faq-category__title">{{ group.category }}</h2>
          <div v-for="faq in group.faqs" :key="faq._id" class="faq-item">
            <button
              type="button"
              class="faq-item__question"
              :aria-expanded="openIds.has(faq._id)"
              @click="toggle(faq._id)"
            >
              <span>{{ faq.question }}</span>
              <i class="bi" :class="openIds.has(faq._id) ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </button>
            <div v-if="openIds.has(faq._id)" class="faq-item__answer">{{ faq.answer }}</div>
          </div>
        </section>
      </article>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { hasSession } from '@/services/session.cookies';
import faqService, { type Faq } from '@/services/faq.service';

defineOptions({ name: 'FaqPage' });

interface FaqGroup {
  category: string;
  faqs: Faq[];
}

const groups = ref<FaqGroup[]>([]);
const openIds = ref(new Set<string>());
const loading = ref(true);
const error = ref('');
const isAuthenticated = hasSession();

function toggle(id: string) {
  if (openIds.value.has(id)) {
    openIds.value.delete(id);
  } else {
    openIds.value.add(id);
  }
}

onMounted(async () => {
  try {
    const faqs = await faqService.getFaqs();
    const byCategory = new Map<string, Faq[]>();
    faqs.forEach((faq) => {
      const list = byCategory.get(faq.category) || [];
      list.push(faq);
      byCategory.set(faq.category, list);
    });
    groups.value = Array.from(byCategory.entries()).map(([category, list]) => ({ category, faqs: list }));
  } catch {
    error.value = 'Impossible de charger la FAQ pour le moment.';
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
@use '../../css/faq.scss' as *;
</style>
