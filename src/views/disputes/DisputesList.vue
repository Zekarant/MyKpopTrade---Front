<template>
  <main class="page">
    <Nav_bar />
    <div class="disputes-page">
      <div class="disputes-page__container">
        <header class="disputes-page__header">
          <h1>Mes litiges</h1>
          <p class="disputes-page__subtitle">
            Litiges ouverts sur vos achats ou ventes. Pour ouvrir un nouveau litige,
            rendez-vous sur la page <router-link to="/adherents/payments">paiements</router-link>.
          </p>
        </header>

        <div v-if="loading" class="empty"><i class="bi bi-arrow-clockwise spin"></i> Chargement…</div>
        <div v-else-if="!disputes.length" class="empty">
          <i class="bi bi-shield-check"></i>
          <p>Aucun litige en cours. C'est bon signe !</p>
        </div>
        <div v-else class="disputes-list">
          <article v-for="d in disputes" :key="d._id" class="dispute-card" @click="open(d._id)">
            <div class="dispute-card__head">
              <span :class="['status-badge', `status-badge--${d.status}`]">{{ statusLabel(d.status) }}</span>
              <small>{{ formatDate(d.createdAt) }}</small>
            </div>
            <div class="dispute-card__body">
              <strong>{{ reasonLabel(d.reason) }}</strong>
              <p>{{ truncate(d.description, 140) }}</p>
            </div>
            <div class="dispute-card__foot">
              <small>
                <i class="bi bi-chat-left-text"></i> {{ d.messages.length }} message(s)
                · Ouvert par {{ d.openedByRole === 'buyer' ? 'l\'acheteur' : 'le vendeur' }}
              </small>
            </div>
          </article>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Nav_bar from '@/components/adherents/nav_bar.vue';
import disputeService, { type Dispute, type DisputeStatus, type DisputeReason } from '@/services/dispute.service';

export default defineComponent({
  name: 'DisputesList',
  components: { Nav_bar },
  data() {
    return { disputes: [] as Dispute[], loading: false };
  },
  async mounted() { await this.fetch(); },
  methods: {
    async fetch() {
      this.loading = true;
      try {
        const res = await disputeService.listMine({ page: 1, limit: 50 });
        this.disputes = res.disputes;
      } catch (e: any) {
        (this as any).$func?.showToastError?.(e.response?.data?.message || 'Erreur');
      } finally { this.loading = false; }
    },
    open(id: string) { this.$router.push(`/disputes/${id}`); },
    formatDate(iso: string) {
      return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    truncate(s: string, n: number) { return s.length > n ? s.substring(0, n) + '…' : s; },
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
    }
  }
});
</script>

<style lang="scss" scoped>
.disputes-page { min-height: 100vh; padding: var(--space-xl) var(--space-md); padding-top: calc(var(--navbar-height) + var(--space-xl)); background: var(--bg-primary); }
.disputes-page__container { max-width: 880px; margin: 0 auto; }
.disputes-page__header h1 { font-size: var(--font-size-2xl); margin: 0 0 var(--space-xs); }
.disputes-page__subtitle { color: var(--text-muted); margin-bottom: var(--space-xl); }
.empty { text-align: center; padding: var(--space-3xl); color: var(--text-muted); i { font-size: 2rem; display: block; margin-bottom: var(--space-md); } .spin { animation: spin 1s linear infinite; } }
@keyframes spin { to { transform: rotate(360deg); } }
.disputes-list { display: flex; flex-direction: column; gap: var(--space-md); }
.dispute-card {
  background: var(--bg-card); border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg); padding: var(--space-md) var(--space-lg);
  cursor: pointer; transition: transform var(--transition-fast);
  &:hover { transform: translateY(-2px); }
}
.dispute-card__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm); small { color: var(--text-muted); } }
.dispute-card__body strong { color: var(--text-primary); }
.dispute-card__body p { color: var(--text-secondary); margin: 4px 0 0; font-size: var(--font-size-sm); }
.dispute-card__foot { margin-top: var(--space-sm); small { color: var(--text-muted); } }
.status-badge {
  font-size: var(--font-size-xs); font-weight: 600; padding: 3px 10px; border-radius: 20px;
  &--opened { background: rgba(255,193,7,.15); color: #e0a800; }
  &--under_review { background: rgba(33,150,243,.15); color: #2196f3; }
  &--resolved { background: rgba(40,167,69,.15); color: #28a745; }
  &--refunded { background: rgba(40,167,69,.15); color: #28a745; }
  &--rejected { background: rgba(108,117,125,.15); color: #6c757d; }
  &--cancelled { background: rgba(108,117,125,.15); color: #6c757d; }
}
</style>
