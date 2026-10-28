<template>
  <div class="review-section">
    <div class="review-section__header">
      <Filter_review @filter="onFilter"></Filter_review>
      <div class="review-section__stats">
        <i class="bi bi-star-fill review-section__star"></i>
        <span class="review-section__rating">{{ stats.averageRating }}</span>
        <span class="review-section__count">({{ stats.totalRatings }} avis)</span>
      </div>
    </div>

    <div v-if="filteredReviews.length" class="review-section__list">
      <div v-for="rating in filteredReviews" :key="rating._id" class="review-item">
        <Review_card class="review-item__card" :review="rating"></Review_card>

        <!-- Réponse existante -->
        <div v-if="rating.response?.content && !isRespondingTo(rating)" class="review-item__response">
          <div class="review-item__response-header">
            <i class="bi bi-reply"></i>
            <span>Réponse du vendeur</span>
          </div>
          <p class="review-item__response-text">{{ rating.response.content }}</p>
          <button v-if="isOwnProfile" class="review-item__edit-btn" @click="openResponsePopup(rating)">
            <i class="bi bi-pencil"></i> Modifier
          </button>
        </div>

        <!-- Bouton répondre -->
        <button
          v-if="isOwnProfile && !rating.response?.content && !isRespondingTo(rating)"
          class="review-item__respond-btn"
          @click="openResponsePopup(rating)"
        >
          <i class="bi bi-reply"></i> Répondre à cet avis
        </button>
      </div>
    </div>
    <div v-else class="empty-state">
      <i class="bi bi-chat-square-text"></i>
      <p>Aucun avis pour le moment.</p>
    </div>

    <!-- Popup réponse avis -->
    <Transition name="fade">
      <div v-if="responding" class="response-popup-overlay" @click.self="closeResponsePopup">
        <div class="response-popup">
          <div class="response-popup__header">
            <h3><i class="bi bi-reply"></i> Répondre à l'avis</h3>
            <button class="response-popup__close" aria-label="Fermer" @click="closeResponsePopup"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
          </div>
          <div class="response-popup__body">
            <textarea
              v-model="responseText"
              aria-label="Votre réponse à l'avis"
              class="response-popup__textarea"
              placeholder="Écrivez votre réponse..."
              rows="4"
            ></textarea>
          </div>
          <div class="response-popup__footer">
            <button class="response-popup__btn response-popup__btn--ghost" @click="closeResponsePopup">Annuler</button>
            <button class="response-popup__btn response-popup__btn--primary" :disabled="!responseText.trim()" @click="submitResponse">
              <i class="bi bi-send"></i> {{ responding.response?.content ? 'Modifier' : 'Envoyer' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, ref, watch } from 'vue'
import Filter_review from '@/components/filter_review.vue'
import Review_card from '@/components/review_card.vue'
import reviewService from '@/services/review.service'

const props = defineProps<{ profileUserId: string; isOwnProfile: boolean }>()

interface Rating {
  _id: string
  rating: number
  review: string
  reviewer: { username: string; profilePicture?: string }
  images?: string[]
  isHidden?: boolean
  createdAt: string
  response?: { content?: string }
}

const stats = ref({ averageRating: 0, totalRatings: 0 })
const ratings = ref<Rating[]>([])
const filterRating = ref('')
const filterSort = ref('recent')

async function loadReviews() {
  if (!props.profileUserId) return
  try {
    const data = await reviewService.getProfileReviews(props.profileUserId)
    stats.value = data.stats
    ratings.value = data.ratings as unknown as Rating[]
  } catch (error) {
    console.error('Erreur lors du chargement des avis:', error)
  }
}

onActivated(loadReviews)
watch(() => props.profileUserId, loadReviews)

function onFilter({ rating, sort }: { rating: string; sort: string }) {
  filterRating.value = rating
  filterSort.value = sort
}

const filteredReviews = computed(() => {
  let filtered = [...ratings.value]
  if (filterRating.value) {
    const wanted = parseInt(filterRating.value)
    filtered = filtered.filter((review) => review.rating === wanted)
  }
  const time = (review: Rating) => new Date(review.createdAt).getTime()
  return filtered.sort((a, b) => {
    switch (filterSort.value) {
      case 'oldest':
        return time(a) - time(b)
      case 'highest':
        return b.rating - a.rating
      case 'lowest':
        return a.rating - b.rating
      case 'recent':
      default:
        return time(b) - time(a)
    }
  })
})

// Le popup garde l'avis lui-même, pas sa position dans la liste filtrée et triée.

const responding = ref<Rating | null>(null)
const responseText = ref('')

function isRespondingTo(rating: Rating) {
  return responding.value?._id === rating._id
}

function openResponsePopup(rating: Rating) {
  responding.value = rating
  responseText.value = rating.response?.content || ''
}

function closeResponsePopup() {
  responding.value = null
  responseText.value = ''
}

async function submitResponse() {
  const review = responding.value
  const text = responseText.value
  if (!review || !text.trim()) return

  try {
    if (review.response?.content) {
      await reviewService.updateReviewResponse(review._id, text)
    } else {
      await reviewService.createReviewResponse(review._id, text)
    }
    review.response = { ...review.response, content: text }
    closeResponsePopup()
  } catch (error) {
    console.error('Erreur lors de la réponse:', error)
  }
}
</script>
