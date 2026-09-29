<template>
  <div class="profile-tab-content">
    <!-- Formulaire de création -->
    <div v-if="isOwnProfile" class="post-create">
      <div class="post-create__input">
        <span class="post-create__avatar">{{ initialOf(username) }}</span>
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
    <div v-if="posts.length" class="feed-posts">
      <div class="feed-post" v-for="post in posts" :key="post._id">
        <div class="feed-post__header">
          <span class="feed-post__avatar">{{ initialOf(post.author?.username) }}</span>
          <div class="feed-post__meta">
            <span class="feed-post__author">
              {{ post.author?.username }}
              <VerifiedBadge v-if="post.author?.isIdentityVerified" :size="12" />
            </span>
            <span class="feed-post__date">{{ formatPostDate(post.createdAt) }}</span>
          </div>
          <button v-if="isOwnProfile" class="feed-post__delete" @click="removePost(post._id)">
            <i class="bi bi-trash"></i>
          </button>
          <button
            v-else
            class="feed-post__delete"
            title="Signaler cette publication"
            @click="emit('report', { type: 'post', id: post._id })"
          >
            <i class="bi bi-flag"></i>
          </button>
        </div>
        <p class="feed-post__content">{{ post.content }}</p>
        <div v-if="post.images?.length" class="feed-post__images">
          <img v-for="(img, i) in post.images" :key="i" :src="API_URL + img" class="feed-post__img" />
        </div>
        <div class="feed-post__actions">
          <button class="feed-post__action" @click="likePost(post)">
            <i :class="post.liked ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
            {{ post.likesCount || 0 }}
          </button>
          <button class="feed-post__action" @click="toggleReplies(post)">
            <i class="bi bi-chat"></i>
            {{ post.repliesCount || 0 }}
          </button>
        </div>
        <!-- Replies inline -->
        <div v-if="post.showReplies" class="feed-post__replies">
          <div class="feed-reply" v-for="reply in post.replies" :key="reply._id">
            <span class="feed-reply__avatar">{{ initialOf(reply.author?.username) }}</span>
            <div class="feed-reply__body">
              <span class="feed-reply__author">
                {{ reply.author?.username }}
                <VerifiedBadge v-if="reply.author?.isIdentityVerified" :size="12" />
              </span>
              <p class="feed-reply__content">{{ reply.content }}</p>
            </div>
          </div>
          <div class="feed-reply__form">
            <input v-model="post.replyText" placeholder="Répondre..." class="feed-reply__input" @keyup.enter="submitReply(post)" />
            <button class="feed-reply__send" :disabled="!post.replyText.trim()" @click="submitReply(post)">
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
</template>

<script setup lang="ts">
import { onActivated, ref, watch } from 'vue'
import VerifiedBadge from '@/components/VerifiedBadge.vue'
import feedPostService from '@/services/feedPost.service'
import { API_URL } from '@/config/api'
import { initialOf, type ReportTarget } from './types'

const props = defineProps<{ profileUserId: string; isOwnProfile: boolean; username?: string }>()
const emit = defineEmits<{ report: [target: ReportTarget] }>()

interface Author {
  username?: string
  isIdentityVerified?: boolean
}

interface Reply {
  _id: string
  author?: Author
  content: string
}

/** Publication telle qu'affichée, avec l'état local de ses réponses. */
interface FeedPost {
  _id: string
  author?: Author
  content: string
  images?: string[]
  likesCount?: number
  repliesCount?: number
  createdAt: string
  liked: boolean
  showReplies: boolean
  replies: Reply[]
  replyText: string
}

const posts = ref<FeedPost[]>([])
const newPostContent = ref('')

async function loadPosts() {
  if (!props.profileUserId) return
  try {
    const data = await feedPostService.getUserPosts(props.profileUserId)
    posts.value = (data.posts || []).map((post: Omit<FeedPost, 'liked' | 'showReplies' | 'replies' | 'replyText'>) => ({
      ...post,
      liked: false,
      showReplies: false,
      replies: [],
      replyText: ''
    }))
  } catch {
    posts.value = []
  }
}

onActivated(loadPosts)
watch(() => props.profileUserId, loadPosts)

async function submitPost() {
  if (!newPostContent.value.trim()) return
  try {
    await feedPostService.createPost(newPostContent.value.trim())
    newPostContent.value = ''
    await loadPosts()
  } catch (e) {
    console.error('Erreur création post:', e)
  }
}

async function removePost(postId: string) {
  if (!confirm('Supprimer ce post ?')) return
  try {
    await feedPostService.deletePost(postId)
    posts.value = posts.value.filter((post) => post._id !== postId)
  } catch (e) {
    console.error('Erreur suppression:', e)
  }
}

async function likePost(post: FeedPost) {
  try {
    const res = await feedPostService.toggleLike(post._id)
    post.liked = res.liked
    post.likesCount = res.likesCount
  } catch {
    // Un « j'aime » perdu n'appelle pas de message d'erreur.
  }
}

async function toggleReplies(post: FeedPost) {
  if (post.showReplies) {
    post.showReplies = false
    return
  }
  try {
    const data = await feedPostService.getPost(post._id)
    post.replies = data.replies || []
  } catch {
    post.replies = []
  }
  post.showReplies = true
}

async function submitReply(post: FeedPost) {
  const content = post.replyText.trim()
  if (!content) return
  try {
    const res = await feedPostService.replyToPost(post._id, content)
    post.replies.push(res.post)
    post.repliesCount = (post.repliesCount || 0) + 1
    post.replyText = ''
  } catch (e) {
    console.error('Erreur réponse:', e)
  }
}

function formatPostDate(date: string) {
  if (!date) return ''
  const d = new Date(date)
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000)
  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days}j`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
</script>
