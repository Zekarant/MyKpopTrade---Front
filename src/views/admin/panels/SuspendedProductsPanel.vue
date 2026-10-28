<template>
  <div class="admin__panel">
    <div class="admin__panel-header">
      <h2>{{ pagination.total }} annonce{{ pagination.total > 1 ? 's' : '' }} suspendue{{ pagination.total > 1 ? 's' : '' }}</h2>
      <button type="button" class="admin__btn" :disabled="loading" @click="load">
        <i class="bi bi-arrow-clockwise"></i> Actualiser
      </button>
    </div>

    <div v-if="products.length === 0" class="admin__empty">
      <i class="bi bi-shield-x"></i>
      <p>{{ loading ? 'Chargement…' : 'Aucune annonce suspendue.' }}</p>
    </div>

    <div v-else class="admin__table-wrapper">
      <table class="admin__table">
        <thead>
          <tr>
            <th>Annonce</th>
            <th>Vendeur</th>
            <th>Motif IA</th>
            <th>Confiance</th>
            <th>Suspendue</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product._id">
            <td>
              <span class="admin__excerpt" :title="product.title">{{ product.title }}</span>
            </td>
            <td class="admin__muted">{{ product.seller?.username || 'Compte supprimé' }}</td>
            <td>
              <div class="admin__badge-group">
                <span
                  v-for="category in product.moderationFlag?.categories || []"
                  :key="category"
                  class="admin__badge admin__badge--danger"
                >
                  {{ MODERATION_CATEGORY_LABELS[category] || category }}
                </span>
                <span
                  v-if="product.moderationFlag?.reviewDecision === 'rejected'"
                  class="admin__badge admin__badge--warning"
                >
                  Déjà rejetée
                </span>
              </div>
              <p v-if="product.moderationFlag?.reasoning" class="admin__excerpt" :title="product.moderationFlag.reasoning">
                {{ product.moderationFlag.reasoning }}
              </p>
            </td>
            <td>
              <span class="admin__badge">
                {{ MODERATION_CONFIDENCE_LABELS[product.moderationFlag?.confidence] || '—' }}
              </span>
            </td>
            <td class="admin__cell-nowrap admin__muted">
              {{ formatDate(product.moderationFlag?.analyzedAt) }}
              · {{ formatAge(product.moderationFlag?.analyzedAt) }}
            </td>
            <td class="admin__cell-nowrap">
              <div class="admin__actions">
                <button
                  type="button"
                  class="admin__icon-btn admin__icon-btn--success"
                  title="Republier l'annonce"
                  @click="approve(product)"
                >
                  <i class="bi bi-check-lg"></i>
                </button>
                <button
                  type="button"
                  class="admin__icon-btn admin__icon-btn--warning"
                  title="Confirmer le signalement, garder en pause"
                  :disabled="product.moderationFlag?.reviewDecision === 'rejected'"
                  @click="reject(product)"
                >
                  <i class="bi bi-eye-slash"></i>
                </button>
                <button
                  type="button"
                  class="admin__icon-btn admin__icon-btn--danger"
                  title="Supprimer l'annonce"
                  @click="productToDelete = product"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination :page="page" :pages="pagination.pages" @change="changePage">
      {{ page }} / {{ pagination.pages }} — {{ pagination.total }} annonces
    </AdminPagination>

    <ReasonPromptModal
      v-if="productToDelete"
      :title="`Supprimer « ${productToDelete.title} »`"
      description="L'annonce est supprimée définitivement. Le motif est conservé dans le journal d'audit."
      :presets="PRODUCT_DELETION_REASONS"
      confirm-label="Supprimer l'annonce"
      confirm-icon="bi bi-trash"
      destructive
      required
      @cancel="productToDelete = null"
      @confirm="remove"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AdminPagination from '../components/AdminPagination.vue';
import adminService from '@/services/admin.service';
import { func } from '@/function';
import ReasonPromptModal from '../components/ReasonPromptModal.vue';
import { PRODUCT_DELETION_REASONS } from '../adminPresets';
import {
  MODERATION_CATEGORY_LABELS,
  MODERATION_CONFIDENCE_LABELS,
  apiErrorMessage,
  formatAge,
  formatDate
} from '../adminFormat';
import type { AdminFlaggedProduct } from '../types';

const PAGE_SIZE = 20;

const emit = defineEmits<{ changed: [] }>();

const products = ref<AdminFlaggedProduct[]>([]);
const pagination = ref({ pages: 1, total: 0 });
const loading = ref(false);
const page = ref(1);
const productToDelete = ref<AdminFlaggedProduct | null>(null);

const load = async () => {
  loading.value = true;
  try {
    const data = await adminService.getProducts({
      page: page.value,
      limit: PAGE_SIZE,
      status: 'suspended'
    });
    products.value = data.products || [];
    pagination.value = data.pagination || { pages: 1, total: 0 };
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'Impossible de charger les annonces suspendues'));
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const changePage = (next: number) => {
  page.value = next;
  load();
};

const refresh = async () => {
  await load();
  emit('changed');
};

const approve = async (product: AdminFlaggedProduct) => {
  try {
    await adminService.reviewFlaggedProduct(product._id, true);
    func.showToastSuccess('Annonce republiée');
    await refresh();
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'La republication a échoué'));
  }
};

const reject = async (product: AdminFlaggedProduct) => {
  try {
    await adminService.reviewFlaggedProduct(product._id, false);
    func.showToastSuccess('Signalement confirmé, annonce toujours en pause');
    await refresh();
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'L\'action a échoué'));
  }
};

const remove = async (reason: string) => {
  const product = productToDelete.value;
  if (!product) return;

  try {
    await adminService.deleteProduct(product._id, reason);
    func.showToastSuccess('Produit supprimé');
    productToDelete.value = null;
    await refresh();
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'La suppression a échoué'));
  }
};

onMounted(load);
</script>
