<template>
  <div class="admin__panel">
    <div class="admin__panel-header">
      <div class="admin__toolbar">
        <input
          v-model="state.search"
          type="search"
          class="admin__input admin__input--search"
          placeholder="Titre ou description…"
          @input="debouncedSearch"
        />
        <select v-model="state.status" class="admin__select" @change="commit({ page: 1 })">
          <option value="">Tous les statuts</option>
          <option value="available">Disponibles</option>
          <option value="reserved">Réservés</option>
          <option value="sold">Vendus</option>
        </select>
        <select v-model="state.type" class="admin__select" @change="commit({ page: 1 })">
          <option value="">Tous les types</option>
          <option v-for="(label, value) in PRODUCT_TYPE_LABELS" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
      <button type="button" class="admin__btn" :disabled="exporting" @click="exportCsv">
        <i class="bi bi-filetype-csv"></i> Exporter
      </button>
    </div>

    <div v-if="products.length === 0" class="admin__empty">
      <i class="bi bi-box-seam"></i>
      <p>{{ loading ? 'Chargement…' : 'Aucun produit pour ce filtre.' }}</p>
    </div>

    <div v-else class="admin__table-wrapper">
      <table class="admin__table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Vendeur</th>
            <th class="admin__cell-numeric">Prix</th>
            <th>Type</th>
            <th>Statut</th>
            <th>Publié</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product._id">
            <td>
              <div class="admin__user-cell">
                <img
                  v-if="thumbUrl(product)"
                  :src="thumbUrl(product)!"
                  class="admin__thumb"
                  alt=""
                  @error="onThumbError(product)"
                />
                <span v-else class="admin__thumb admin__thumb--placeholder"><i class="bi bi-image"></i></span>
                <span class="admin__excerpt" :title="product.title">{{ product.title }}</span>
              </div>
            </td>
            <td class="admin__muted">{{ product.seller?.username || 'Compte supprimé' }}</td>
            <td class="admin__cell-numeric">{{ formatPrice(product.price, product.currency) }}</td>
            <td>
              <span class="admin__badge admin__badge--accent">
                {{ PRODUCT_TYPE_LABELS[product.type] || product.type }}
              </span>
            </td>
            <td>
              <span class="admin__badge" :class="statusBadge(product).class">{{ statusBadge(product).label }}</span>
            </td>
            <td class="admin__cell-nowrap admin__muted">{{ formatDate(product.createdAt) }}</td>
            <td>
              <button
                type="button"
                class="admin__icon-btn admin__icon-btn--danger"
                title="Supprimer l'annonce"
                @click="productToDelete = product"
              >
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="pagination.totalPages > 1" class="admin__pagination">
      <button
        type="button"
        class="admin__icon-btn"
        :disabled="state.page <= 1"
        @click="commit({ page: state.page - 1 })"
      >
        <i class="bi bi-chevron-left"></i>
      </button>
      <span>{{ state.page }} / {{ pagination.totalPages }} — {{ pagination.totalItems }} annonces</span>
      <button
        type="button"
        class="admin__icon-btn"
        :disabled="state.page >= pagination.totalPages"
        @click="commit({ page: state.page + 1 })"
      >
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>

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

<script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue';
  import adminService from '@/services/admin.service';
  import { API_URL } from '@/config/api';
  import { func } from '@/function';
  import ReasonPromptModal from '../components/ReasonPromptModal.vue';
  import { PRODUCT_DELETION_REASONS } from '../adminPresets';
  import { useAdminQueryState } from '../useAdminQueryState';
  import { PRODUCT_TYPE_LABELS, apiErrorMessage, formatDate, formatPrice } from '../adminFormat';

  const PAGE_SIZE = 20;
  const SEARCH_DEBOUNCE_MS = 300;

  export default defineComponent({
    name: 'ProductsPanel',
    components: { ReasonPromptModal },
    emits: ['changed'],
    setup(_props, { emit }) {
      const products = ref<any[]>([]);
      const pagination = ref({ totalPages: 1, totalItems: 0 });
      const loading = ref(false);
      const exporting = ref(false);
      const productToDelete = ref<any>(null);
      const brokenThumbs = ref<Set<string>>(new Set());

      const { state, commit } = useAdminQueryState(
        { search: '', status: '', type: '', page: 1 },
        () => load()
      );

      const thumbUrl = (product: any): string | null => {
        const image = product.images?.[0];
        if (!image || brokenThumbs.value.has(product._id)) return null;
        return image.startsWith('http') ? image : `${API_URL}${image}`;
      };

      const onThumbError = (product: any) => {
        brokenThumbs.value = new Set(brokenThumbs.value).add(product._id);
      };

      const statusBadge = (product: any) => {
        if (product.isSold) return { label: 'Vendu', class: 'admin__badge--success' };
        if (product.isReserved) return { label: 'Réservé', class: 'admin__badge--info' };
        if (product.isAvailable) return { label: 'Disponible', class: 'admin__badge--accent' };
        return { label: 'Indisponible', class: 'admin__badge' };
      };

      const load = async () => {
        loading.value = true;
        try {
          const data = await adminService.getProducts({
            page: state.page,
            limit: PAGE_SIZE,
            search: state.search.trim() || undefined,
            status: state.status || undefined,
            type: state.type || undefined
          });
          products.value = data.products || [];
          pagination.value = data.pagination || { totalPages: 1, totalItems: 0 };
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'Impossible de charger les produits'));
          products.value = [];
        } finally {
          loading.value = false;
        }
      };

      let searchTimer: ReturnType<typeof setTimeout> | null = null;
      const debouncedSearch = () => {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => commit({ page: 1 }), SEARCH_DEBOUNCE_MS);
      };

      const remove = async (reason: string) => {
        const product = productToDelete.value;
        if (!product) return;

        try {
          await adminService.deleteProduct(product._id, reason);
          func.showToastSuccess('Produit supprimé');
          productToDelete.value = null;
          await load();
          emit('changed');
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'La suppression a échoué'));
        }
      };

      const exportCsv = async () => {
        exporting.value = true;
        try {
          await adminService.exportProductsCsv({
            search: state.search.trim() || undefined,
            status: state.status || undefined,
            type: state.type || undefined
          });
        } catch (error) {
          func.showToastError(apiErrorMessage(error, 'L\'export a échoué'));
        } finally {
          exporting.value = false;
        }
      };

      onMounted(load);

      return {
        PRODUCT_TYPE_LABELS,
        PRODUCT_DELETION_REASONS,
        state,
        commit,
        products,
        pagination,
        loading,
        exporting,
        productToDelete,
        thumbUrl,
        onThumbError,
        statusBadge,
        formatDate,
        formatPrice,
        debouncedSearch,
        remove,
        exportCsv
      };
    }
  });
</script>
