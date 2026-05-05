<template>
  <main class="page">
    <Nav_bar />
    <div class="dispute-detail">
      <div class="dispute-detail__container" v-if="dispute">
        <header class="dispute-detail__header">
          <button class="btn btn--ghost btn--sm" @click="$router.back()">
            <i class="bi bi-arrow-left"></i> Retour
          </button>
          <h1>Litige #{{ dispute._id.substring(0, 8) }}</h1>
          <div class="dispute-detail__meta">
            <span :class="['status-badge', `status-badge--${dispute.status}`]">{{ statusLabel(dispute.status) }}</span>
            <span class="reason-pill">{{ reasonLabel(dispute.reason) }}</span>
            <small>Ouvert le {{ formatDate(dispute.createdAt) }} par {{ dispute.openedByRole === 'buyer' ? 'l\'acheteur' : 'le vendeur' }}</small>
          </div>
        </header>

        <section v-if="dispute.resolution" class="dispute-detail__resolution">
          <strong><i class="bi bi-gavel"></i> Décision : {{ statusLabel(dispute.resolution.outcome) }}</strong>
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

<script lang="ts">
import { defineComponent } from 'vue';
import Cookies from 'js-cookie';
import Nav_bar from '@/components/adherents/nav_bar.vue';
import disputeService, { type Dispute, type DisputeStatus, type DisputeReason } from '@/services/dispute.service';

export default defineComponent({
  name: 'DisputeDetail',
  components: { Nav_bar },
  props: { id: { type: String, required: true } },
  data() {
    return {
      dispute: null as Dispute | null,
      loading: false,
      reply: '',
      sending: false,
      myId: Cookies.get('id_user') || ''
    };
  },
  computed: {
    sortedMessages(): any[] {
      if (!this.dispute) return [];
      return [...this.dispute.messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    },
    canReply(): boolean {
      if (!this.dispute) return false;
      return ['opened', 'under_review'].includes(this.dispute.status);
    },
    canCancel(): boolean {
      if (!this.dispute) return false;
      return this.canReply && this.dispute.openedBy === this.myId;
    }
  },
  async mounted() { await this.fetch(); },
  watch: {
    id() { this.fetch(); }
  },
  methods: {
    async fetch() {
      this.loading = true;
      try {
        const res = await disputeService.getOne(this.id);
        this.dispute = res.dispute;
      } catch (e: any) {
        (this as any).$func?.showToastError?.(e.response?.data?.message || 'Erreur');
      } finally { this.loading = false; }
    },
    async send() {
      if (!this.dispute) return;
      this.sending = true;
      try {
        const res = await disputeService.addMessage(this.dispute._id, { content: this.reply });
        this.dispute = res.dispute;
        this.reply = '';
        (this as any).$func?.showToastSuccess?.('Message envoyé');
      } catch (e: any) {
        (this as any).$func?.showToastError?.(e.response?.data?.message || 'Erreur');
      } finally { this.sending = false; }
    },
    async cancelDispute() {
      if (!this.dispute) return;
      if (!confirm('Retirer définitivement ce litige ?')) return;
      try {
        const res = await disputeService.cancel(this.dispute._id);
        this.dispute = res.dispute;
        (this as any).$func?.showToastSuccess?.('Litige retiré');
      } catch (e: any) {
        (this as any).$func?.showToastError?.(e.response?.data?.message || 'Erreur');
      }
    },
    formatDate(iso: string) {
      return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    formatDateTime(iso: string) {
      return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },
    statusLabel(s: DisputeStatus) {
      return ({
        opened: 'Ouvert', under_review: 'En cours d\'examen',
        resolved: 'Résolu (vendeur)', refunded: 'Remboursé',
        rejected: 'Rejeté', cancelled: 'Retiré'
      } as Record<DisputeStatus, string>)[s];
    },
    reasonLabel(r: DisputeReason) {
      return ({
        not_received: 'Colis non reçu', damaged: 'Colis endommagé',
        not_as_described: 'Produit non conforme', counterfeit: 'Contrefaçon',
        wrong_item: 'Mauvais article', partial_delivery: 'Livraison partielle',
        seller_unresponsive: 'Vendeur ne répond pas',
        buyer_abuse: 'Abus acheteur', other: 'Autre'
      } as Record<DisputeReason, string>)[r];
    },
    roleLabel(r: string) {
      return ({ buyer: 'Acheteur', seller: 'Vendeur', admin: 'Modération' } as Record<string, string>)[r] || r;
    },
    roleIcon(r: string) {
      return ({ buyer: 'bi bi-bag', seller: 'bi bi-shop', admin: 'bi bi-shield-check' } as Record<string, string>)[r] || 'bi bi-person';
    }
  }
});
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
