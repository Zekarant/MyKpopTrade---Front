<template>
  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-slash-circle"></i> Utilisateurs bloqués</h3>
    <div class="settings-card__body">
      <p class="settings-card__intro">
        Un membre bloqué ne peut plus vous écrire, vous faire d'offre, vous suivre ni vous laisser d'avis.
        Suivez le traitement de vos signalements dans
        <router-link :to="{ name: 'my_reports' }">Mes signalements</router-link>.
      </p>

      <p v-if="loading && blockedUsers.length === 0" class="blocked-users__empty">Chargement…</p>
      <p v-else-if="blockedUsers.length === 0" class="blocked-users__empty">Vous n'avez bloqué personne.</p>

      <ul v-else class="blocked-users">
        <li v-for="user in blockedUsers" :key="user._id" class="blocked-users__item">
          <span class="blocked-users__avatar"><UserAvatar :user="user" :size="32" /></span>
          <router-link :to="`/adherents/profile/${user._id}`" class="blocked-users__name">{{ user.username }}</router-link>
          <span class="blocked-users__date">depuis le {{ formatDate(user.blockedAt) }}</span>
          <button
            type="button"
            class="btn-settings btn-settings--sm btn-settings--ghost"
            :disabled="unblockingId === user._id"
            :aria-label="`Débloquer ${user.username}`"
            @click="unblock(user)"
          >
            Débloquer
          </button>
        </li>
      </ul>

      <button
        v-if="hasMore"
        type="button"
        class="btn-settings btn-settings--full btn-settings--ghost"
        :disabled="loading"
        @click="loadMore"
      >
        Afficher plus
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
/** Liste paginée des membres que j'ai bloqués, avec déblocage. */
import { computed, onMounted, ref } from 'vue';
import { func } from '@/function';
import UserAvatar from '@/components/UserAvatar.vue';
import blockService, { type BlockedUser } from '@/services/block.service';
import { apiMessage, formatDate, isSessionLost } from './shared';

const PAGE_SIZE = 20;

const blockedUsers = ref<BlockedUser[]>([]);
/** Blocages enregistrés côté serveur, déblocages faits ici compris. */
const total = ref(0);
/**
 * Rangs de la liste du serveur déjà parcourus. Distinct du nombre de membres
 * affichés : le serveur peut écarter d'une page le blocage d'un compte supprimé.
 */
const covered = ref(0);
const loading = ref(false);
const unblockingId = ref<string | null>(null);

const hasMore = computed(() => covered.value < total.value);

/** Lit la page `page` et ajoute les membres pas encore affichés. */
async function readPage(page: number): Promise<number> {
  const result = await blockService.listBlocked(page, PAGE_SIZE);
  const shown = new Set(blockedUsers.value.map((user) => user._id));
  const fresh = result.blockedUsers.filter((user) => !shown.has(user._id));
  blockedUsers.value = [...blockedUsers.value, ...fresh];
  total.value = result.pagination.total;
  covered.value = Math.min(page * PAGE_SIZE, total.value);
  return fresh.length;
}

async function withLoading(load: () => Promise<void>) {
  loading.value = true;
  try {
    await load();
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'Impossible de charger les membres bloqués.'));
  } finally {
    loading.value = false;
  }
}

function loadFirstPage() {
  return withLoading(async () => {
    blockedUsers.value = [];
    await readPage(1);
  });
}

/**
 * Suite de la liste. Un déblocage décale la liste côté serveur : la « page
 * suivante » sauterait alors des membres. On relit donc la page qui contient
 * le premier rang pas encore parcouru (les membres déjà affichés sont écartés),
 * puis les suivantes jusqu'à avoir une page de nouveaux membres.
 * `covered` avance à chaque tour : la boucle s'arrête toujours.
 */
function loadMore() {
  return withLoading(async () => {
    let added = 0;
    while (added < PAGE_SIZE && hasMore.value) {
      added += await readPage(Math.floor(covered.value / PAGE_SIZE) + 1);
    }
  });
}

async function unblock(user: BlockedUser) {
  unblockingId.value = user._id;
  try {
    await blockService.unblock(user._id);
    blockedUsers.value = blockedUsers.value.filter((blocked) => blocked._id !== user._id);
    // Le membre débloqué était dans les rangs parcourus : la suite remonte d'un rang.
    total.value = Math.max(0, total.value - 1);
    covered.value = Math.max(0, covered.value - 1);
    func.showToastSuccess(`${user.username} est débloqué.`);
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'Impossible de débloquer ce membre.'));
  } finally {
    unblockingId.value = null;
  }
}

onMounted(loadFirstPage);
</script>

<style lang="scss" scoped>
.blocked-users {
  list-style: none;
  margin: 0 0 var(--space-sm);
  padding: 0;
}

.blocked-users__item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--surface-border);

  &:last-child { border-bottom: none; }
}

.blocked-users__avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.blocked-users__name {
  font-weight: 600;
  color: var(--text-primary);
}

.blocked-users__date {
  flex: 1;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.blocked-users__empty {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}
</style>
