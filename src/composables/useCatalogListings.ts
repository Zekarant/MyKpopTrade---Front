import { computed, ref } from 'vue'
import postService, { type CatalogListParams } from '@/services/post.service'
import type { Post } from '@/types/post.types'

const PAGE_SIZE = 20

/**
 * Annonces en vente d'une page catalogue (groupe, album), chargées page par
 * page : « Voir plus » ajoute la suivante au lieu de tout recharger.
 */
export function useCatalogListings() {
  const products = ref<Post[]>([])
  const page = ref(0)
  const pages = ref(0)
  const loading = ref(false)
  const failed = ref(false)
  let criteria: Omit<CatalogListParams, 'page' | 'limit'> = {}

  const hasMore = computed(() => page.value < pages.value)

  async function fetchPage(pageToLoad: number) {
    loading.value = true
    failed.value = false
    try {
      const response = await postService.getCatalogPosts({ ...criteria, page: pageToLoad, limit: PAGE_SIZE })
      products.value = pageToLoad === 1 ? response.products : [...products.value, ...response.products]
      page.value = pageToLoad
      pages.value = response.pagination?.pages ?? 0
    } catch {
      failed.value = true
    } finally {
      loading.value = false
    }
  }

  /** Repart de la première page avec de nouveaux critères. */
  function load(newCriteria: Omit<CatalogListParams, 'page' | 'limit'>) {
    criteria = newCriteria
    products.value = []
    page.value = 0
    pages.value = 0
    return fetchPage(1)
  }

  function loadMore() {
    if (loading.value || !hasMore.value) return
    return fetchPage(page.value + 1)
  }

  return { products, loading, failed, hasMore, load, loadMore }
}
