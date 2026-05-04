<template>
    <main class="page">
        <Nav_bar @toggle-popup-add="showPopup"></Nav_bar>
        <div class="profile-layout">
          <div class="profile-layout__content">
            <div class="profile-banner-wrap">
              <banner_profil :profilInfo="profilInfo" :admin="myProfile"></banner_profil>
            </div>
            <segment_profil @partDisplayed="changePart"></segment_profil>

            <!-- Posts -->
            <div class="profile-tab-content" v-if="partView === 'post'">
              <!-- Formulaire de création -->
              <div v-if="myProfile" class="post-create">
                <div class="post-create__input">
                  <span class="post-create__avatar">{{ profilInfo.username?.charAt(0).toUpperCase() }}</span>
                  <textarea v-model="newPostContent" class="post-create__textarea" placeholder="Quoi de neuf ?" rows="2" maxlength="1000"></textarea>
                </div>
                <div class="post-create__footer">
                  <span class="post-create__count">{{ newPostContent.length }}/1000</span>
                  <button class="post-create__btn" :disabled="!newPostContent.trim()" @click="submitPost">
                    <i class="bi bi-send"></i> Publier
                  </button>
                </div>
              </div>

              <!-- Feed posts -->
              <div v-if="feedPosts.length" class="feed-posts">
                <div class="feed-post" v-for="post in feedPosts" :key="post._id">
                  <div class="feed-post__header">
                    <span class="feed-post__avatar">{{ post.author?.username?.charAt(0).toUpperCase() }}</span>
                    <div class="feed-post__meta">
                      <span class="feed-post__author">
                        {{ post.author?.username }}
                        <span v-if="post.author?.isIdentityVerified" class="verified-badge"><i class="bi bi-patch-check-fill"></i></span>
                      </span>
                      <span class="feed-post__date">{{ formatPostDate(post.createdAt) }}</span>
                    </div>
                    <button v-if="myProfile" class="feed-post__delete" @click="removeFeedPost(post._id)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                  <p class="feed-post__content">{{ post.content }}</p>
                  <div v-if="post.images?.length" class="feed-post__images">
                    <img v-for="(img, i) in post.images" :key="i" :src="apiUrl + img" class="feed-post__img" />
                  </div>
                  <div class="feed-post__actions">
                    <button class="feed-post__action" @click="likePost(post)">
                      <i :class="post._liked ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
                      {{ post.likesCount || 0 }}
                    </button>
                    <button class="feed-post__action" @click="openReplies(post)">
                      <i class="bi bi-chat"></i>
                      {{ post.repliesCount || 0 }}
                    </button>
                  </div>
                  <!-- Replies inline -->
                  <div v-if="post._showReplies" class="feed-post__replies">
                    <div class="feed-reply" v-for="reply in post._replies" :key="reply._id">
                      <span class="feed-reply__avatar">{{ reply.author?.username?.charAt(0).toUpperCase() }}</span>
                      <div class="feed-reply__body">
                        <span class="feed-reply__author">
                          {{ reply.author?.username }}
                          <span v-if="reply.author?.isIdentityVerified" class="verified-badge"><i class="bi bi-patch-check-fill"></i></span>
                        </span>
                        <p class="feed-reply__content">{{ reply.content }}</p>
                      </div>
                    </div>
                    <div class="feed-reply__form">
                      <input v-model="post._replyText" placeholder="Répondre..." class="feed-reply__input" @keyup.enter="submitReply(post)" />
                      <button class="feed-reply__send" :disabled="!post._replyText?.trim()" @click="submitReply(post)">
                        <i class="bi bi-send"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <i class="bi bi-chat-square-text"></i>
                <p>Aucun post pour le moment.</p>
              </div>
            </div>

            <!-- Annonces -->
            <div class="profile-tab-content" v-if="partView === 'annoucement'">
              <div v-if="myProfile" class="annonce-header">
                <button class="annonce-add-btn" @click="$router.push({ name: 'add_post' })">
                  <i class="bi bi-plus-lg"></i> Créer une annonce
                </button>
              </div>
              <Grid v-if="dataCardList.length" :style="{ width: '100%' }" :admin="myProfile" :dataUser="profilInfo" :dataList="activeProducts"></Grid>
              <div v-else class="empty-state">
                <i class="bi bi-megaphone"></i>
                <p>Aucune annonce pour le moment.</p>
                <button v-if="myProfile" class="empty-state__btn" @click="$router.push({ name: 'add_post' })">
                  Publier ma première annonce
                </button>
              </div>
            </div>

            <!-- About -->
            <div class="about-section" v-if="partView === 'about'">
              <div class="about-card">
                <!-- Bio -->
                <div class="about-card__block">
                  <h3 class="about-card__title"><i class="bi bi-person-lines-fill"></i> Description</h3>
                  <p v-if="!myProfile && profilInfo.bio" class="about-card__bio">{{ profilInfo.bio }}</p>
                  <p v-if="!myProfile && !profilInfo.bio" class="about-card__bio about-card__bio--empty">Aucune description renseignée.</p>
                  <textarea
                    v-if="myProfile"
                    v-model="profilInfo.bio"
                    @change="info_update()"
                    class="about-card__textarea"
                    placeholder="Décrivez-vous en quelques mots..."
                    rows="3"
                  ></textarea>
                </div>

                <!-- Infos -->
                <div class="about-card__block">
                  <h3 class="about-card__title"><i class="bi bi-info-circle"></i> Informations</h3>
                  <div class="about-card__grid">
                    <div class="about-card__row">
                      <span class="about-card__label">Nom d'utilisateur</span>
                      <span class="about-card__value">{{ profilInfo.username }}</span>
                    </div>
                    <div class="about-card__row" v-if="profilInfo.location || myProfile">
                      <span class="about-card__label">Lieu de résidence</span>
                      <span v-if="!myProfile" class="about-card__value">{{ profilInfo.location }}</span>
                      <input v-if="myProfile" v-model="profilInfo.location" @change="info_update()" class="about-card__input" placeholder="Votre ville..." />
                    </div>
                  </div>
                </div>

                <!-- Réseaux sociaux -->
                <div class="about-card__block">
                  <h3 class="about-card__title"><i class="bi bi-share"></i> Réseaux sociaux</h3>
                  <div class="about-card__grid">
                    <div class="about-card__row">
                      <span class="about-card__label"><i class="bi bi-instagram"></i> Instagram</span>
                      <span v-if="!myProfile && profilInfo.socialLinks?.instagram" class="about-card__value">{{ profilInfo.socialLinks.instagram }}</span>
                      <input v-if="myProfile" v-model="profilInfo.socialLinks.instagram" @change="info_update()" class="about-card__input" placeholder="@votre_compte" />
                    </div>
                    <div class="about-card__row">
                      <span class="about-card__label"><i class="bi bi-twitter-x"></i> Twitter</span>
                      <span v-if="!myProfile && profilInfo.socialLinks?.twitter" class="about-card__value">{{ profilInfo.socialLinks.twitter }}</span>
                      <input v-if="myProfile" v-model="profilInfo.socialLinks.twitter" @change="info_update()" class="about-card__input" placeholder="@votre_compte" />
                    </div>
                    <div class="about-card__row">
                      <span class="about-card__label"><i class="bi bi-discord"></i> Discord</span>
                      <span v-if="!myProfile && profilInfo.socialLinks?.discord" class="about-card__value">{{ profilInfo.socialLinks.discord }}</span>
                      <input v-if="myProfile" v-model="profilInfo.socialLinks.discord" @change="info_update()" class="about-card__input" placeholder="Pseudo#0000" />
                    </div>
                  </div>
                </div>

                <!-- Date + Certif -->
                <div class="about-card__footer">
                  <span v-if="profilInfo.createdAt" class="about-card__date">
                    <i class="bi bi-calendar3"></i> Membre depuis le {{ memberSinceFormatted }}
                  </span>
                  <div v-if="profilInfo.isSellerVerified" class="about-card__badge">
                    <img src="@/assets/images/certif.svg" alt="Certifié" width="20" />
                    <span>Compte certifié</span>
                  </div>
                </div>

                <button v-if="isBtnSaveVisible && myProfile" class="about-card__save" @click="saveProfile">
                  <i class="bi bi-check-lg"></i> Enregistrer
                </button>
              </div>
            </div>

            <!-- Reviews -->
            <div class="review-section" v-if="partView === 'review'">
              <div class="review-section__header">
                <Filter_review @filter="handleFilterChange"></Filter_review>
                <div class="review-section__stats">
                  <i class="bi bi-star-fill review-section__star"></i>
                  <span class="review-section__rating">{{ reviews.stats.averageRating }}</span>
                  <span class="review-section__count">({{ reviews.stats.totalRatings }} avis)</span>
                </div>
              </div>

              <div class="review-section__list" v-if="filteredReviews.length">
                <div class="review-item" v-for="(rating, index) in filteredReviews" :key="index">
                  <Review_card class="review-item__card" :review="rating"></Review_card>

                  <!-- Réponse existante -->
                  <div v-if="rating.response?.content && !isRespondingTo(index)" class="review-item__response">
                    <div class="review-item__response-header">
                      <i class="bi bi-reply"></i>
                      <span>Réponse du vendeur</span>
                    </div>
                    <p class="review-item__response-text">{{ rating.response.content }}</p>
                    <button v-if="myProfile" @click="openResponsePopup(index, rating)" class="review-item__edit-btn">
                      <i class="bi bi-pencil"></i> Modifier
                    </button>
                  </div>

                  <!-- Bouton répondre -->
                  <button
                    v-if="myProfile && !rating.response?.content && !isRespondingTo(index)"
                    @click="openResponsePopup(index, rating)"
                    class="review-item__respond-btn"
                  >
                    <i class="bi bi-reply"></i> Répondre à cet avis
                  </button>
                </div>
              </div>
              <div v-else class="empty-state">
                <i class="bi bi-chat-square-text"></i>
                <p>Aucun avis pour le moment.</p>
              </div>
            </div>

            <!-- Wishlist -->
            <div class="profile-tab-content" v-if="partView === 'wishlist'">
              <div class="empty-state">
                <i class="bi bi-heart"></i>
                <p>Aucun article dans la wishlist.</p>
              </div>
            </div>

            <!-- Followers -->
            <div class="profile-tab-content" v-if="partView === 'followers'">
              <div class="followers-section">
                <div class="followers-section__header">
                  <h3 class="followers-section__title"><i class="bi bi-people"></i> Abonnés ({{ followersTotal }})</h3>
                </div>
                <div v-if="followersList.length" class="followers-section__list">
                  <div class="follower-card" v-for="follower in followersList" :key="follower._id">
                    <router-link :to="`/adherents/profile/${follower._id}`" class="follower-card__link">
                      <span class="follower-card__avatar">{{ follower.username?.charAt(0).toUpperCase() }}</span>
                      <div class="follower-card__info">
                        <span class="follower-card__name">{{ follower.username }}</span>
                        <span v-if="follower.bio" class="follower-card__bio">{{ follower.bio }}</span>
                      </div>
                    </router-link>
                    <button v-if="myProfile" class="follower-card__remove" @click="removeFollower(follower._id)" title="Retirer cet abonné">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
                <div v-else class="empty-state">
                  <i class="bi bi-people"></i>
                  <p>Aucun abonné pour le moment.</p>
                </div>
                <div v-if="followersPage < followersTotalPages" class="followers-section__more">
                  <button class="followers-section__load-btn" @click="loadMoreFollowers">Voir plus</button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Popup réponse avis -->
        <Transition name="fade">
          <div v-if="responsePopup.visible" class="response-popup-overlay" @click.self="closeResponsePopup">
            <div class="response-popup">
              <div class="response-popup__header">
                <h3><i class="bi bi-reply"></i> Répondre à l'avis</h3>
                <button @click="closeResponsePopup" class="response-popup__close"><i class="bi bi-x-lg"></i></button>
              </div>
              <div class="response-popup__body">
                <textarea
                  v-model="responsePopup.text"
                  class="response-popup__textarea"
                  placeholder="Écrivez votre réponse..."
                  rows="4"
                ></textarea>
              </div>
              <div class="response-popup__footer">
                <button @click="closeResponsePopup" class="response-popup__btn response-popup__btn--ghost">Annuler</button>
                <button @click="submitResponse" class="response-popup__btn response-popup__btn--primary" :disabled="!responsePopup.text.trim()">
                  <i class="bi bi-send"></i> {{ responsePopup.isEdit ? 'Modifier' : 'Envoyer' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <popup_add_item v-if="isPopupVisible" @close="closePopup"></popup_add_item>

    </main>
  </template>

  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import banner_profil from '@/components/adherents/banner.vue';
    import segment_profil from '@/components/adherents/segment_profil.vue';
    import Grid from '@/components/grid.vue';
    import Cookies from "js-cookie";
    import { useRoute } from "vue-router";
    import axios from 'axios';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';
    import Filter_review from '@/components/filter_review.vue';
    import Review_card from '@/components/review_card.vue';
    import authentificationService from '@/services/authentification.service';
    import reviewService from '@/services/review.service';
    import feedPostService from '@/services/feedPost.service';
    import followService from '@/services/follow.service';
    import { API_URL } from '@/config/api';

  export default defineComponent({
    name: 'profile',
    components: {
        Nav_bar,
        banner_profil,
        segment_profil,
        Grid,
        Popup_add_item,
        Filter_review,
        Review_card
    },


    mounted() {
      this.checkUserProfile();
      authentificationService.verifSession().then(() => {
          const id = this.route?.params?.id;
          if (id === 'me') {
            this.myProfile = true;
            this.getInfoProfil().then(() => this.loadFeedPosts());
            this.getInventory();
          } else if (id) {
            this.myProfile = false;
            const userId = Array.isArray(id) ? id[0] : id;
            this.getInfoUser(userId);
          }
        });
    },
    watch: {
    'route.params.id': {
      immediate: false,
      handler(newId, oldId) {
        if (newId !== oldId) {
          if (newId === 'me') {
            this.myProfile = true;
            this.getInfoProfil();
            this.getInventory();
          } else if (newId) {
            this.myProfile = false;
            const userId = Array.isArray(newId) ? newId[0] : newId;
            this.getInfoUser(userId);
          }
        }
      }
    }
  },
    computed: {
      activeProducts() {
        return (this.dataCardList as any[]).filter((p: any) => p.status === 'available' || !p.status);
      },
      memberSinceFormatted() {
        if (!this.profilInfo.createdAt) return '';
        const date = new Date(this.profilInfo.createdAt);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      },
      filteredReviews() {
        let filtered = [...this.reviews.ratings];

        // Filtrer par note
        if (this.filterRating) {
          const ratingValue = parseInt(this.filterRating);
          filtered = filtered.filter(review => review.rating === ratingValue);
        }

        // Trier
        filtered.sort((a, b) => {
          switch (this.filterSort) {
            case 'oldest':
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'highest':
              return b.rating - a.rating;
            case 'lowest':
              return a.rating - b.rating;
            case 'recent':
            default:
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        });

        return filtered;
      }
    },
    setup() {
        var partView = ref('post');
        const route = useRoute();
        const id = route.params.id;
        var myProfile = ref(false);
        const apiUrl = API_URL;

        if (id === 'me') {
            myProfile.value = true;
        }
        var profilInfo = ref({

        } as { username?: string; [key: string]: any })
        var dataCardList = ref([]);
        var feedPosts = ref<any[]>([]);
        var newPostContent = ref('');
        var followersList = ref<any[]>([]);
        var followersTotal = ref(0);
        var followersPage = ref(1);
        var followersTotalPages = ref(1);
        return {
          dataCardList,
          profilInfo,
          partView,
          route,
          id,
          myProfile,
          apiUrl,
          feedPosts,
          newPostContent,
          followersList,
          followersTotal,
          followersPage,
          followersTotalPages
        };
    },
    data() {
      return {
        isPopupVisible: false,
        isBtnSaveVisible: false,
        reviews: {
          stats: {
            averageRating: 0,
            totalRatings: 0
          },
          ratings: [] as any[]
        },
        filterRating: '',
        filterSort: 'recent',
        responsePopup: {
          visible: false,
          text: '',
          index: -1,
          review: null as any,
          isEdit: false
        }
      };
    },
    created() {
      this.checkUserProfile();
    },
    methods: {
      checkUserProfile() {
        const id = this.route.params.id; // Récupère l'ID passé en paramètre
        if(id === 'me'){
          this.myProfile = true;
        }
      },
      changePart(part: string){
        this.partView = part;

        if(part === 'review'){
          this.getReview();
        }
        if(part === 'post'){
          this.loadFeedPosts();
        }
        if(part === 'followers'){
          this.loadFollowers();
        }
      },

      async getInfoProfil(){
        const sessionToken = Cookies.get('sessionToken');
        await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

            }
          }).then(response => {

          if (response.status === 200) {
            this.profilInfo = response.data.user;
            if(!this.profilInfo.socialLinks){
              this.profilInfo.socialLinks = {
                instagram: '',
                twitter: '',
                discord: ''
              }
            }
          }
          }).catch(error => {
            if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
             authentificationService.verifSession();
            }
          });


      },
      getInfoUser(user: string){
        const sessionToken = Cookies.get('sessionToken');

        axios.get(`${import.meta.env.VITE_API_URL}/api/profiles/user/`+user, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`

          }
        }).then(response => {
          if (response.status === 200) {
            this.profilInfo = response.data.profile;
            this.getInventory(this.profilInfo.id);
            this.loadFeedPosts();
          }
        }).catch(error => {
          if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
           authentificationService.verifSession();
          }
        });
      },
      async getInventory(idUser=null){
        let url = '/api/products/inventory/me';
        if(idUser != null){
          url = '/api/products/inventory/user/'+idUser;
        }
        const sessionToken = Cookies.get('sessionToken');

        await axios.get(`${import.meta.env.VITE_API_URL}`+url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

          }
        }).then(response => {
          if (response.status === 200) {
            this.dataCardList = response.data.products;

          }
        }).catch(error => {
          if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
           authentificationService.verifSession();
          }
        });
      },
      showPopup() {
        this.isPopupVisible = true; // Affiche la popup
      },
      info_update(){
        this.isBtnSaveVisible = true;
      },
      async getReview(){
        try {
          const reviews = await reviewService.getProfileReviews(this.profilInfo.id || this.profilInfo._id);
          this.reviews = reviews;
        } catch (error) {
          console.error('Erreur lors du chargement des avis:', error);
        }
      },
      handleFilterChange({ rating, sort }: { rating: string; sort: string }) {
        this.filterRating = rating;
        this.filterSort = sort;
      },
      async saveProfile() {
        const sessionToken = Cookies.get('sessionToken');
        try {
          await axios.put(
            `${import.meta.env.VITE_API_URL}/api/profiles/me`,
            {
              bio: this.profilInfo.bio,
              location: this.profilInfo.location,
              socialLinks: this.profilInfo.socialLinks,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
              }
            }
          );
          this.isBtnSaveVisible = false; // Cache le bouton après sauvegarde
          // Optionnel : afficher un message de succès
        } catch (error) {
          // Optionnel : afficher un message d'erreur
          console.error(error);
        }
      },
      closePopup() {
        this.isPopupVisible = false;
        this.getInventory(); // Recharge l'inventaire après la fermeture de la popup
      },
      // === Feed Posts ===
      async loadFeedPosts() {
        try {
          const userId = this.profilInfo?._id || this.profilInfo?.id;
          if (!userId) return;
          const data = await feedPostService.getUserPosts(userId);
          this.feedPosts = (data.posts || []).map((p: any) => ({
            ...p,
            _liked: false,
            _showReplies: false,
            _replies: [],
            _replyText: ''
          }));
        } catch (e) {
          this.feedPosts = [];
        }
      },
      async submitPost() {
        if (!this.newPostContent.trim()) return;
        try {
          await feedPostService.createPost(this.newPostContent.trim());
          this.newPostContent = '';
          this.loadFeedPosts();
        } catch (e) {
          console.error('Erreur création post:', e);
        }
      },
      async removeFeedPost(postId: string) {
        if (!confirm('Supprimer ce post ?')) return;
        try {
          await feedPostService.deletePost(postId);
          this.feedPosts = this.feedPosts.filter((p: any) => p._id !== postId);
        } catch (e) {
          console.error('Erreur suppression:', e);
        }
      },
      async likePost(post: any) {
        try {
          const res = await feedPostService.toggleLike(post._id);
          post._liked = res.liked;
          post.likesCount = res.likesCount;
        } catch (e) { /* ignore */ }
      },
      async openReplies(post: any) {
        if (post._showReplies) {
          post._showReplies = false;
          return;
        }
        try {
          const data = await feedPostService.getPost(post._id);
          post._replies = data.replies || [];
          post._showReplies = true;
        } catch (e) {
          post._replies = [];
          post._showReplies = true;
        }
      },
      async submitReply(post: any) {
        if (!post._replyText?.trim()) return;
        try {
          const res = await feedPostService.replyToPost(post._id, post._replyText.trim());
          post._replies.push(res.post);
          post.repliesCount = (post.repliesCount || 0) + 1;
          post._replyText = '';
        } catch (e) {
          console.error('Erreur réponse:', e);
        }
      },
      formatPostDate(date: string) {
        if (!date) return '';
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `il y a ${minutes}min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `il y a ${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `il y a ${days}j`;
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      },
      // === Followers ===
      async loadFollowers(page = 1) {
        try {
          const userId = this.profilInfo?._id || this.profilInfo?.id;
          if (!userId) return;
          const data = await followService.getFollowers(userId, page);
          if (page === 1) {
            this.followersList = data.followers || [];
          } else {
            this.followersList.push(...(data.followers || []));
          }
          this.followersTotal = data.total || 0;
          this.followersPage = data.page || 1;
          this.followersTotalPages = data.totalPages || 1;
        } catch (e) {
          this.followersList = [];
        }
      },
      async loadMoreFollowers() {
        await this.loadFollowers(this.followersPage + 1);
      },
      async removeFollower(followerId: string) {
        if (!confirm('Retirer cet abonné ?')) return;
        try {
          await followService.removeFollower(followerId);
          this.followersList = this.followersList.filter((f: any) => f._id !== followerId);
          this.followersTotal = Math.max(0, this.followersTotal - 1);
        } catch (e) {
          console.error('Erreur suppression follower:', e);
        }
      },
      handleUpdateReview({ review, index }: { review: any; index: number }) {
        if (Array.isArray(this.reviews.ratings) && this.reviews.ratings.length > index) {
          this.reviews.ratings[index] = review;
        }
      },
      isRespondingTo(index: number) {
        return this.responsePopup.visible && this.responsePopup.index === index;
      },
      openResponsePopup(index: number, rating: any) {
        this.responsePopup = {
          visible: true,
          text: rating.response?.content || '',
          index,
          review: rating,
          isEdit: !!rating.response?.content
        };
      },
      closeResponsePopup() {
        this.responsePopup.visible = false;
        this.responsePopup.text = '';
        this.responsePopup.index = -1;
        this.responsePopup.review = null;
      },
      async submitResponse() {
        const sessionToken = Cookies.get('sessionToken');
        const review = this.responsePopup.review;
        if (!review || !this.responsePopup.text.trim()) return;

        try {
          const method = this.responsePopup.isEdit ? 'put' : 'post';
          const response = await axios[method](
            `${import.meta.env.VITE_API_URL}/api/profiles/ratings/${review._id}/response`,
            { response: this.responsePopup.text },
            { headers: { Authorization: `Bearer ${sessionToken}` } }
          );

          if (response.status === 200 || response.status === 201) {
            // Update local data
            const idx = this.responsePopup.index;
            if (this.reviews.ratings[idx]) {
              this.reviews.ratings[idx].response = {
                ...this.reviews.ratings[idx].response,
                content: this.responsePopup.text
              };
            }
            this.closeResponsePopup();
          }
        } catch (error: any) {
          console.error('Erreur lors de la réponse:', error);
          if (error?.response?.data?.message === "Token invalide" || error?.response?.data?.code === "TOKEN_EXPIRED") {
            authentificationService.verifSession();
          }
        }
      }
    },
  })
  </script>

<style lang="scss" scoped>
/* Layout */
.profile-layout {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-md);
}

.profile-layout__content {
  width: 100%;
}

.profile-banner-wrap {
  border-radius: var(--radius-xl);
  overflow: visible;
  margin-bottom: var(--space-md);
}

.profile-tab-content {
  padding: var(--space-md) 0;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--space-md);
  color: var(--text-muted);
  text-align: center;

  i {
    font-size: 3rem;
    margin-bottom: var(--space-md);
    opacity: 0.4;
  }

  p {
    font-size: var(--font-size-sm);
    margin: 0 0 var(--space-md);
  }
}

.empty-state__btn {
  padding: 10px 20px;
  background: var(--accent-gradient);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover { opacity: 0.9; transform: translateY(-1px); }
}

/* Annonces header */
.annonce-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-md);
}

.annonce-add-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 10px 20px;
  background: var(--accent-gradient);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover { opacity: 0.9; transform: translateY(-1px); }
}

/* About section */
.about-section {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-lg) var(--space-md);
}

.about-card {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.about-card__title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0 0 var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  i { color: var(--accent-pink); }
}

.about-card__bio {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0;

  &--empty {
    color: var(--text-muted);
    font-style: italic;
  }
}

.about-card__textarea {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-family: var(--font-sans);
  resize: vertical;
  min-height: 80px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &::placeholder { color: var(--text-muted); }
  &:focus {
    outline: none;
    border-color: var(--accent-pink);
    box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1);
  }
}

.about-card__grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.about-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  gap: var(--space-md);
}

.about-card__label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  white-space: nowrap;
}

.about-card__value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  text-align: right;
}

.about-card__input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--surface-border);
  padding: var(--space-xs) 0;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  text-align: right;
  min-width: 120px;
  transition: border-color var(--transition-fast);

  &::placeholder { color: var(--text-muted); }
  &:focus {
    outline: none;
    border-color: var(--accent-pink);
  }
}

.about-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--surface-border);
}

.about-card__date {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.about-card__badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-xs);
  color: var(--success);
  font-weight: 600;
}

.about-card__save {
  width: 100%;
  padding: var(--space-sm) var(--space-lg);
  background: var(--accent-gradient);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  transition: all var(--transition-fast);

  &:hover { opacity: 0.9; transform: translateY(-1px); }
}

/* Review section */
.review-section {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-lg) var(--space-md);
}

.review-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--surface-border);
}

.review-section__stats {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.review-section__star {
  color: #FFD485;
  font-size: var(--font-size-md);
}

.review-section__rating {
  font-weight: 700;
  font-size: var(--font-size-md);
  color: var(--text-primary);
}

.review-section__count {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.review-section__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.review-item {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: border-color var(--transition-fast);

  &:hover { border-color: var(--accent-pink-light); }
}

.review-item__response {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent-pink);
}

.review-item__response-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: var(--space-sm);
}

.review-item__response-text {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
}

.review-item__edit-btn {
  margin-top: var(--space-sm);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  cursor: pointer;
  padding: var(--space-xs) 0;

  &:hover { color: var(--accent-pink); }
}

.review-item__respond-btn {
  margin-top: var(--space-md);
  background: transparent;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--accent-pink);
    color: var(--accent-pink);
    background: rgba(255, 45, 120, 0.05);
  }
}

/* Response popup */
.response-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: var(--space-lg);
}

.response-popup {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-xl);
  width: 480px;
  max-width: 100%;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.25s ease;
}

.response-popup__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--surface-border);

  h3 {
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: var(--space-sm);

    i { color: var(--accent-pink); }
  }
}

.response-popup__close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-md);

  &:hover { color: var(--text-primary); background: var(--bg-tertiary); }
}

.response-popup__body {
  padding: var(--space-xl);
}

.response-popup__textarea {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-family: var(--font-sans);
  resize: vertical;
  min-height: 100px;

  &::placeholder { color: var(--text-muted); }
  &:focus {
    outline: none;
    border-color: var(--accent-pink);
    box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1);
  }
}

.response-popup__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  border-top: 1px solid var(--surface-border);
}

.response-popup__btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  transition: all var(--transition-fast);

  &--ghost {
    background: transparent;
    border: 1px solid var(--surface-border);
    color: var(--text-secondary);

    &:hover { background: var(--bg-tertiary); color: var(--text-primary); }
  }

  &--primary {
    background: var(--accent-gradient);
    border: none;
    color: white;

    &:hover { opacity: 0.9; transform: translateY(-1px); }
    &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  }
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from { transform: translateY(20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .profile-layout {
    padding: var(--space-sm);
  }
  .review-section__header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* === Feed Posts === */
.post-create {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.post-create__input {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
}

.post-create__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-gradient);
  color: white;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.post-create__textarea {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  resize: none;
  outline: none;
  font-family: var(--font-sans);
}

.post-create__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--surface-border);
}

.post-create__count {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.post-create__btn {
  padding: 6px 16px;
  background: var(--accent-pink);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  transition: opacity var(--transition-fast);

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { opacity: 0.9; }
}

.feed-posts {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.feed-post {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.feed-post__header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.feed-post__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-gradient);
  color: white;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feed-post__meta {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.feed-post__author {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.feed-post__date {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.feed-post__delete {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);

  &:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }
}

.feed-post__content {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0 0 var(--space-sm);
  white-space: pre-wrap;
  word-break: break-word;
}

.feed-post__images {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
  overflow-x: auto;
}

.feed-post__img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.feed-post__actions {
  display: flex;
  gap: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--surface-border);
}

.feed-post__action {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);

  &:hover { color: var(--accent-pink); background: rgba(255, 45, 120, 0.05); }

  .bi-heart-fill { color: var(--accent-pink); }
}

.feed-post__replies {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--surface-border);
}

.feed-reply {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
}

.feed-reply__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface-hover);
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feed-reply__body {
  flex: 1;
}

.feed-reply__author {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.feed-reply__content {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 2px 0 0;
}

.feed-reply__form {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
}

.feed-reply__input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;

  &:focus { border-color: var(--accent-pink); }
}

.feed-reply__send {
  padding: 6px 10px;
  background: var(--accent-pink);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

/* Verified badge */
.verified-badge {
  color: var(--accent-pink);
  font-size: 12px;
  line-height: 1;
}

/* Followers section */
.followers-section__header {
  margin-bottom: var(--space-md);
}
.followers-section__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  i { margin-right: 8px; }
}
.followers-section__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.follower-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
  &:hover { background: var(--surface-hover); }
}
.follower-card__link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  flex: 1;
  min-width: 0;
}
.follower-card__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}
.follower-card__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.follower-card__name {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}
.follower-card__bio {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.follower-card__remove {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  &:hover { color: var(--danger); background: rgba(255, 59, 48, 0.1); }
}
.followers-section__more {
  text-align: center;
  margin-top: var(--space-md);
}
.followers-section__load-btn {
  padding: 8px 24px;
  background: var(--surface-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  &:hover { background: var(--surface-hover); }
}
</style>
