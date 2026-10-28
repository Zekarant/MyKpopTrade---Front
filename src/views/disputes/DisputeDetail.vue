<template>
  <main class="page">
    <div class="dispute-detail">
      <div v-if="dispute" class="dispute-detail__container">
        <header class="dispute-detail__header">
          <button class="btn btn--ghost btn--sm" @click="$router.back()">
            <i class="bi bi-arrow-left"></i> Retour
          </button>
          <h1>Litige #{{ dispute._id.substring(0, 8) }}</h1>
          <div class="dispute-detail__meta">
            <span :class="['status-badge', `status-badge--${dispute.status}`]">{{ DISPUTE_STATUS_LABELS[dispute.status] }}</span>
            <span class="reason-pill">{{ DISPUTE_REASON_LABELS[dispute.reason] }}</span>
            <small>Ouvert le {{ formatDate(dispute.createdAt) }} par {{ dispute.openedByRole === 'buyer' ? 'l\'acheteur' : 'le vendeur' }}</small>
          </div>
        </header>

        <section v-if="dispute.resolution" class="dispute-detail__resolution">
          <strong><i class="bi bi-gavel"></i> Décision : {{ DISPUTE_STATUS_LABELS[dispute.resolution.outcome] }}</strong>
          <p v-if="dispute.resolution.notes">{{ dispute.resolution.notes }}</p>
          <small>Tranché le {{ formatDate(dispute.resolution.decidedAt) }}</small>
        </section>

        <section class="dispute-detail__messages">
          <div v-for="(m, i) in sortedMessages" :key="i" :class="['msg', `msg--${m.authorRole}`]">
            <div class="msg__avatar"><i :class="roleIcon(m.authorRole)"></i></div>
            <div class="msg__body">
              <div class="msg__head">
                <strong>{{ roleLabel(m.authorRole) }}</strong>
                <small>{{ formatDateTime(m.createdAt) }}</small>
              </div>
              <p>{{ m.content }}</p>
              <ul v-if="m.attachments?.length" class="msg__attachments">
                <li v-for="(a, j) in m.attachments" :key="j">
                  <a :href="a" target="_blank" rel="noopener"><i class="bi bi-paperclip"></i> Pièce jointe {{ j + 1 }}</a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section v-if="canReply" class="dispute-detail__reply">
          <h3>Répondre</h3>
          <textarea v-model="reply" rows="4" placeholder="Apportez des précisions ou des preuves..." maxlength="2000"></textarea>
          <div class="reply-actions">
            <button class="btn btn--primary" :disabled="!reply.trim() || sending" @click="send">
              <i class="bi bi-send"></i> Envoyer
            </button>
            <button v-if="canCancel" class="btn btn--ghost" @click="cancelDispute">
              <i class="bi bi-x-circle"></i> Retirer le litige
            </button>
          </div>
        </section>
      </div>
      <div v-else-if="loading" class="empty"><i class="bi bi-arrow-clockwise spin"></i> Chargement…</div>
      <div v-else class="empty"><i class="bi bi-shield-x"></i><p>Litige introuvable.</p></div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { func } from '@/function';
import { currentUserId } from '@/services/session.cookies';
import { apiErrorMessage } from '@/services/apiError';
import disputeService, { type Dispute } from '@/services/dispute.service';
import { formatDate, formatDateTime } from '@/utils/format';
import { DISPUTE_REASON_LABELS, DISPUTE_STATUS_LABELS } from './disputeLabels';

defineOptions({ name: 'DisputeDetail' });

const props = defineProps<{ id: string }>();

const ROLE_LABELS: Record<string, string> = { buyer: 'Acheteur', seller: 'Vendeur', admin: 'Modération' };
const ROLE_ICONS: Record<string, string> = { buyer: 'bi bi-bag', seller: 'bi bi-shop', admin: 'bi bi-shield-check' };

const dispute = ref<Dispute | null>(null);
const loading = ref(false);
const reply = ref('');
const sending = ref(false);
const myId = currentUserId() || '';

const sortedMessages = computed(() => {
  if (!dispute.value) return [];
  return [...dispute.value.messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
});

const canReply = computed(() => !!dispute.value && ['opened', 'under_review'].includes(dispute.value.status));
const canCancel = computed(() => canReply.value && dispute.value?.openedBy === myId);

async function fetchDispute() {
  loading.value = true;
  try {
    const res = await disputeService.getOne(props.id);
    dispute.value = res.dispute;
  } catch (e) {
    func.showToastError(apiErrorMessage(e, 'Erreur'));
  } finally {
    loading.value = false;
  }
}

async function send() {
  if (!dispute.value) return;
  sending.value = true;
  try {
    const res = await disputeService.addMessage(dispute.value._id, { content: reply.value });
    dispute.value = res.dispute;
    reply.value = '';
    func.showToastSuccess('Message envoyé');
  } catch (e) {
    func.showToastError(apiErrorMessage(e, 'Erreur'));
  } finally {
    sending.value = false;
  }
}

async function cancelDispute() {
  if (!dispute.value) return;
  if (!confirm('Retirer définitivement ce litige ?')) return;
  try {
    const res = await disputeService.cancel(dispute.value._id);
    dispute.value = res.dispute;
    func.showToastSuccess('Litige retiré');
  } catch (e) {
    func.showToastError(apiErrorMessage(e, 'Erreur'));
  }
}

function roleLabel(role: string) {
  return ROLE_LABELS[role] || role;
}

function roleIcon(role: string) {
  return ROLE_ICONS[role] || 'bi bi-person';
}

watch(() => props.id, fetchDispute);
onMounted(fetchDispute);
</script>

<style lang="scss" scoped>
.dispute-detail { min-height: 100vh; padding: var(--space-xl) var(--space-md); padding-top: calc(var(--navbar-height) + var(--space-xl)); background: var(--bg-primary); }
.dispute-detail__container { max-width: 880px; margin: 0 auto; }
.dispute-detail__header h1 { margin: var(--space-md) 0; font-size: var(--font-size-2xl); }
.dispute-detail__meta { display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap; small { color: var(--text-muted); } }
.reason-pill { background: var(--bg-tertiary); padding: 3px 10px; border-radius: 20px; font-size: var(--font-size-sm); }
.dispute-detail__resolution {
  background: var(--bg-card); border-left: 3px solid var(--accent-pink); padding: var(--space-md); border-radius: var(--radius-md);
  margin: var(--space-xl) 0;
  strong { display: block; margin-bottom: 4px; }
  p { color: var(--text-secondary); margin: 0 0 4px; }
  small { color: var(--text-muted); }
}
.dispute-detail__messages { display: flex; flex-direction: column; gap: var(--space-md); margin: var(--space-xl) 0; }
.msg { display: flex; gap: var(--space-sm); }
.msg__avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--text-secondary);
}
.msg--admin .msg__avatar { background: var(--accent-pink); color: white; }
.msg--seller .msg__avatar { background: rgba(33,150,243,.2); color: #2196f3; }
.msg__body {
  flex: 1; background: var(--bg-card); border: 1px solid var(--surface-border);
  border-radius: var(--radius-md); padding: var(--space-sm) var(--space-md);
}
.msg__head { display: flex; justify-content: space-between; gap: var(--space-sm); margin-bottom: 4px; small { color: var(--text-muted); } }
.msg__attachments { list-style: none; padding: 0; margin: 4px 0 0; a { color: var(--accent-pink); font-size: var(--font-size-sm); text-decoration: none; } }
.dispute-detail__reply {
  background: var(--bg-card); border: 1px solid var(--surface-border);
  border-radius: var(--radius-md); padding: var(--space-md);
  h3 { margin: 0 0 var(--space-sm); font-size: var(--font-size-lg); }
  textarea {
    width: 100%; padding: 10px; border: 1px solid var(--surface-border);
    border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary);
    font-family: inherit; resize: vertical;
    &:focus { outline: none; border-color: var(--accent-pink); }
  }
}
.reply-actions { display: flex; gap: var(--space-sm); margin-top: var(--space-sm); }
.btn {
  display: inline-flex; align-items: center; gap: var(--space-xs);
  padding: 8px 16px; border-radius: var(--radius-md); border: none;
  font-size: var(--font-size-sm); font-weight: 600; cursor: pointer;
  &--sm { padding: 6px 12px; font-size: var(--font-size-xs); }
  &--primary { background: var(--accent-gradient); color: white; }
  &--ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--surface-border); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.status-badge {
  font-size: var(--font-size-xs); font-weight: 600; padding: 3px 10px; border-radius: 20px;
  &--opened { background: rgba(255,193,7,.15); color: #e0a800; }
  &--under_review { background: rgba(33,150,243,.15); color: #2196f3; }
  &--resolved, &--refunded { background: rgba(40,167,69,.15); color: #28a745; }
  &--rejected, &--cancelled { background: rgba(108,117,125,.15); color: #6c757d; }
}
.empty { text-align: center; padding: var(--space-3xl); color: var(--text-muted); i { font-size: 2rem; display: block; margin-bottom: var(--space-md); } .spin { animation: spin 1s linear infinite; } }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
