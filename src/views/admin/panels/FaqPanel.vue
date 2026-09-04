<template>
  <div class="admin__panel">
    <div class="admin__panel-header">
      <input
        v-model="search"
        type="search"
        class="admin__input admin__input--search"
        placeholder="Rechercher une question…"
      />
      <button type="button" class="admin__btn admin__btn--primary" @click="openForm()">
        <i class="bi bi-plus-lg"></i> Nouvelle FAQ
      </button>
    </div>

    <div v-if="filteredGroups.length === 0" class="admin__empty">
      <i class="bi bi-question-circle"></i>
      <p>{{ loading ? 'Chargement…' : 'Aucune FAQ trouvée.' }}</p>
    </div>

    <template v-else>
      <div v-for="group in filteredGroups" :key="group.category" class="admin__panel-header">
        <h3 style="margin: 0; font-size: var(--font-size-md); color: var(--text-primary)">
          {{ group.category }} ({{ group.faqs.length }})
        </h3>
      </div>
      <template v-for="group in filteredGroups" :key="`table-${group.category}`">
        <div class="admin__table-wrapper">
          <table class="admin__table">
            <thead>
              <tr>
                <th>Question</th>
                <th class="admin__cell-numeric">Ordre</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="faq in group.faqs" :key="faq._id">
                <td>{{ faq.question }}</td>
                <td class="admin__cell-numeric">{{ faq.order }}</td>
                <td>
                  <span
                    class="admin__badge"
                    :class="faq.isPublished ? 'admin__badge--success' : 'admin__badge--warning'"
                  >
                    {{ faq.isPublished ? 'Publié' : 'Brouillon' }}
                  </span>
                </td>
                <td class="admin__cell-nowrap">
                  <div class="admin__actions">
                    <button type="button" class="admin__icon-btn" title="Modifier" @click="openForm(faq)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      class="admin__icon-btn admin__icon-btn--danger"
                      title="Supprimer"
                      @click="removeFaq(faq)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <div v-if="showForm" class="admin__modal-overlay" @click.self="showForm = false">
      <div class="admin__modal admin__modal--wide" role="dialog" aria-modal="true">
        <div class="admin__modal-header">
          <h3>{{ editing ? 'Modifier la FAQ' : 'Nouvelle FAQ' }}</h3>
          <button type="button" class="admin__icon-btn" aria-label="Fermer" @click="showForm = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <form class="admin__modal-body" @submit.prevent="submitFaq">
          <div class="admin__field">
            <label for="faq-question">Question</label>
            <textarea
              id="faq-question"
              v-model="form.question"
              class="admin__input"
              rows="2"
              maxlength="300"
              required
            ></textarea>
            <span class="admin__hint">{{ form.question.length }} / 300</span>
          </div>
          <div class="admin__field">
            <label for="faq-answer">Réponse</label>
            <textarea
              id="faq-answer"
              v-model="form.answer"
              class="admin__input"
              rows="6"
              maxlength="5000"
              required
            ></textarea>
            <span class="admin__hint">{{ form.answer.length }} / 5000</span>
          </div>
          <div class="admin__field">
            <label for="faq-category">Catégorie</label>
            <input
              id="faq-category"
              v-model="form.category"
              type="text"
              class="admin__input"
              list="faq-categories"
              placeholder="general"
            />
            <datalist id="faq-categories">
              <option v-for="category in existingCategories" :key="category" :value="category" />
            </datalist>
          </div>
          <div class="admin__field">
            <label for="faq-order">Ordre</label>
            <input id="faq-order" v-model.number="form.order" type="number" class="admin__input" />
            <span class="admin__hint">Détermine l'ordre d'affichage dans sa catégorie.</span>
          </div>
          <div class="admin__field">
            <label>
              <input v-model="form.isPublished" type="checkbox" class="admin__checkbox" />
              Publiée
            </label>
          </div>
          <p v-if="formError" class="admin__hint" style="color: var(--danger)">{{ formError }}</p>
        </form>
        <div class="admin__modal-footer">
          <button type="button" class="admin__btn admin__btn--ghost" @click="showForm = false">Annuler</button>
          <button type="button" class="admin__btn admin__btn--primary" :disabled="submitting" @click="submitFaq">
            {{ editing ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onMounted, ref } from 'vue';
  import faqService, { type Faq } from '@/services/faq.service';
  import { func } from '@/function';
  import { apiErrorMessage } from '../adminFormat';

  export default defineComponent({
    name: 'FaqPanel',
    setup() {
      const faqs = ref<Faq[]>([]);
      const search = ref('');
      const loading = ref(false);
      const submitting = ref(false);
      const formError = ref('');

      const showForm = ref(false);
      const editing = ref<Faq | null>(null);
      const form = ref({ question: '', answer: '', category: 'general', order: 0, isPublished: true });

      const load = async () => {
        loading.value = true;
        try {
          faqs.value = await faqService.getAllFaqs();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger les FAQ'));
        } finally {
          loading.value = false;
        }
      };

      const existingCategories = computed(() => {
        const categories = new Set(faqs.value.map((faq) => faq.category));
        return Array.from(categories).sort();
      });

      const filteredGroups = computed(() => {
        const term = search.value.trim().toLowerCase();
        const filtered = term
          ? faqs.value.filter((faq) => faq.question.toLowerCase().includes(term))
          : faqs.value;

        const byCategory = new Map<string, Faq[]>();
        filtered.forEach((faq) => {
          const list = byCategory.get(faq.category) || [];
          list.push(faq);
          byCategory.set(faq.category, list);
        });

        return Array.from(byCategory.entries())
          .map(([category, list]) => ({
            category,
            faqs: [...list].sort((a, b) => a.order - b.order)
          }))
          .sort((a, b) => a.category.localeCompare(b.category));
      });

      const openForm = (faq?: Faq) => {
        editing.value = faq ?? null;
        formError.value = '';
        form.value = faq
          ? {
              question: faq.question,
              answer: faq.answer,
              category: faq.category,
              order: faq.order,
              isPublished: faq.isPublished
            }
          : { question: '', answer: '', category: 'general', order: 0, isPublished: true };
        showForm.value = true;
      };

      const submitFaq = async () => {
        if (submitting.value) return;

        const question = form.value.question.trim();
        const answer = form.value.answer.trim();
        if (!question || !answer) {
          formError.value = 'La question et la réponse sont requises.';
          return;
        }

        const payload = {
          question,
          answer,
          category: form.value.category.trim() || 'general',
          order: Number(form.value.order) || 0,
          isPublished: form.value.isPublished
        };

        submitting.value = true;
        formError.value = '';
        try {
          if (editing.value) {
            await faqService.updateFaq(editing.value._id, payload);
            func.showToastSuccess('FAQ modifiée');
          } else {
            await faqService.createFaq(payload);
            func.showToastSuccess('FAQ créée');
          }
          showForm.value = false;
          await load();
        } catch (error) {
          formError.value = apiErrorMessage(error, "L'enregistrement a échoué");
        } finally {
          submitting.value = false;
        }
      };

      const removeFaq = async (faq: Faq) => {
        if (!confirm(`Supprimer la FAQ « ${faq.question} » ?`)) return;

        try {
          await faqService.deleteFaq(faq._id);
          func.showToastSuccess('FAQ supprimée');
          await load();
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La suppression a échoué'));
        }
      };

      onMounted(load);

      return {
        faqs,
        search,
        loading,
        submitting,
        formError,
        showForm,
        editing,
        form,
        existingCategories,
        filteredGroups,
        openForm,
        submitFaq,
        removeFaq
      };
    }
  });
</script>
