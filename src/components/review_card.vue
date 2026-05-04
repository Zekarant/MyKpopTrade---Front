<template v-if="!review.isHidden">
    <div v-bind="$attrs" @click="closeMenu" class="review-card">
        <div class="review-card__date">Posté le {{ formatDate(review.createdAt) }}</div>
        <div class="review-card__body">
            <div class="review-card__content">
                <div class="review-card__header">
                    <div class="review-card__avatar">
                        <img :src="getUrlImage(review.reviewer.profilePicture)" @error="onImgError($event)" alt="Profile" />
                    </div>
                    <div class="review-card__user">
                        <span class="review-card__username">@{{ review.reviewer.username }}</span>
                        <div class="review-card__stars">
                            <i v-for="n in 5" :key="n" class="bi" :class="n <= review.rating ? 'bi-star-fill' : 'bi-star'" ></i>
                            <span class="review-card__rating-num">{{ review.rating }}/5</span>
                        </div>
                    </div>
                    <button @click="toggleMenu($event)" class="review-card__menu-btn">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <div v-if="isMenuVisible" class="review-card__dropdown">
                        <button @click="showPopupReport = true" class="review-card__dropdown-item">
                            <i class="bi bi-flag"></i> Signaler
                        </button>
                    </div>
                </div>
                <div class="review-card__text">
                    <p>{{ review.review }}</p>
                </div>
            </div>
            <div v-if="review.images && review.images.length > 0" class="review-card__images">
                <ImageCarousel :images="review.images" />
            </div>
        </div>
    </div>
    <report_card @closeReport="showPopupReport = false" :type="'rating'" :id="review._id" v-if="showPopupReport"></report_card>
</template>

  <script lang="ts">
    import ImageCarousel from '../components/ImageCarousel.vue';
    import report_card from '../components/report_card.vue';

    export default {
        name: "review_card",
        components: { ImageCarousel, report_card },
        inheritAttrs: false,
        props: {
            review: { type: Object, required: true },
        },
        data() {
            return {
                isMenuVisible: false,
                showPopupReport: false
            };
        },
        methods: {
            toggleMenu(event: MouseEvent) {
                event.stopPropagation();
                this.isMenuVisible = !this.isMenuVisible;
            },
            closeMenu() {
                this.isMenuVisible = false;
            },
            onImgError(event: Event) {
                const img = event.target as HTMLImageElement;
                img.style.display = 'none';
                if (img.parentElement) {
                    img.parentElement.classList.add('review-card__avatar--fallback');
                }
            },
            getUrlImage(url: string) {
                if (!url) return '';
                if (url.startsWith('http')) return url;
                return `${import.meta.env.VITE_API_URL}${url}`;
            },
            formatDate(dateString: string) {
                const date = new Date(dateString);
                return date.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            },
        },
    };
  </script>

  <style lang="scss" scoped>
.review-card {
    background: var(--bg-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: box-shadow var(--transition-fast);
    &:hover { box-shadow: var(--shadow-md); }
}
.review-card__date {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    border-bottom: 1px solid var(--surface-border);
}
.review-card__body {
    display: flex;
    min-height: 160px;
}
.review-card__content {
    flex: 1;
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-width: 0;
}
.review-card__header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    position: relative;
}
.review-card__avatar {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--accent-gradient);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    img { width: 100%; height: 100%; object-fit: cover; }
    &--fallback::after {
        content: '\F4DA';
        font-family: 'bootstrap-icons';
        color: white;
        font-size: 1.2rem;
    }
}
.review-card__user { flex: 1; min-width: 0; }
.review-card__username {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-primary);
}
.review-card__stars {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-top: 2px;
    i { font-size: 0.75rem; color: #FFD485; }
}
.review-card__rating-num {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-left: 6px;
}
.review-card__menu-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    &:hover { background: var(--surface-hover); }
}
.review-card__dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 10;
    overflow: hidden;
}
.review-card__dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 8px 16px;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    &:hover { background: var(--surface-hover); color: var(--danger); }
}
.review-card__text {
    flex: 1;
    p {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        line-height: 1.5;
        margin: 0;
        word-break: break-word;
    }
}
.review-card__images {
    width: 200px;
    flex-shrink: 0;
    background: var(--bg-tertiary);
    border-left: 1px solid var(--surface-border);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
@media (max-width: 768px) {
    .review-card__body { flex-direction: column-reverse; }
    .review-card__images {
        width: 100%;
        height: 160px;
        border-left: none;
        border-bottom: 1px solid var(--surface-border);
    }
}
  </style>
