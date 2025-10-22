<template>
<div class="popup-overlay" @click.self="$emit('close')">
  <div @click.stop class="popup-content offer-modal">
    <div class="popup-header">
      <h3>Faire une offre</h3>
      <button class="close-btn" @click="$emit('close')">
        <i class="bi bi-x"></i>
      </button>
    </div>
    
    <div class="product-summary">
      <div class="product-image">
        <img :src="domain_api + conversation.productId.images[0]" :alt="conversation.productId.title">
      </div>
      <div class="product-details">
        <h4>{{ conversation.productId.title }}</h4>
        <div class="original-price">
          Prix initial: <span class="price-value">{{ conversation.productId.price }}€</span>
        </div>
      </div>
    </div>
    
    <form @submit.prevent="submitOffer" class="offer-form">
      <div class="form-group">
        <label for="offerAmount">Votre offre (€)</label>
        <input 
          type="number" 
          id="offerAmount" 
          v-model="offerAmount" 
          :min="1" 
          :max="conversation.productId.price - 1"
          step="0.01"
          placeholder="Montant de votre offre"
          required
        >
        <div class="price-info">
          <span class="savings" v-if="offerAmount && offerAmount < conversation.productId.price">
            Économie: {{ (conversation.productId.price - offerAmount).toFixed(2) }}€
          </span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="offerMessage">Message (optionnel)</label>
        <textarea 
          id="offerMessage" 
          v-model="offerMessage" 
          placeholder="Ajoutez un message pour expliquer votre offre..."
          rows="3"
          maxlength="500"
        ></textarea>
        <div class="character-count">{{ offerMessage.length }}/500</div>
      </div>
      
      <div class="form-group">
           <input class="form-check-input" type="checkbox" v-model="offerTermsAccepted" required>

            <label class="checkbox-label">
            J'accepte les <a href="#" class="terms-link">conditions d'utilisation</a> pour les offres
            </label>
      </div>
      
      <div class="offer-actions">
        <button type="button" class="btn-secondary" @click="$emit('close')">
          Annuler
        </button>
        <button 
          type="submit" 
          class="btn-primary" 
          :disabled="!offerAmount || !offerTermsAccepted || sendingOffer"
        >
          <i class="bi" :class="sendingOffer ? 'bi-arrow-clockwise' : 'bi-wallet'"></i>
          {{ sendingOffer ? 'Envoi...' : 'Envoyer l\'offre' }}
        </button>
      </div>
    </form>
  </div>
</div>
</template>
  
<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
    name: 'send_offer',
    props: {
        conversation: {
            type: Object,
            required: true,
        }
    },
    emits: ['close', 'offerSent'],
    setup(props, { emit }) {
        const offerAmount = ref()
        const offerMessage = ref('')
        const offerTermsAccepted = ref(false)
        const sendingOffer = ref(false)
        const domain_api = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        // Méthode pour soumettre l'offre
        const submitOffer = async () => {
            if (!offerAmount.value || !offerTermsAccepted.value) return
            
            try {
                sendingOffer.value = true
                
                // Appel API pour envoyer l'offre
                const offerData = {
                    productId: props.conversation.productId._id,
                    amount: parseFloat(offerAmount.value),
                    message: offerMessage.value,
                    conversationId: props.conversation._id || props.conversation.id
                }
                
                // await offerService.sendOffer(offerData)
                
                // Émettre l'événement avec les données de l'offre
                emit('offerSent', {
                    amount: offerAmount.value,
                    message: offerMessage.value,
                    offerData
                })
                
                // Réinitialiser le formulaire
                offerAmount.value = ''
                offerMessage.value = ''
                offerTermsAccepted.value = false
                
            } catch (error) {
                console.error('Erreur lors de l\'envoi de l\'offre:', error)
            } finally {
                sendingOffer.value = false
            }
        }

        return {
            offerAmount,
            offerTermsAccepted,
            sendingOffer,
            offerMessage,
            domain_api,
            submitOffer
        }
    }
})
</script>
  
<style lang="scss" scoped>
.offer-modal {
  max-width: 480px;
  width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #e9ecef;
}

.popup-header h3 {
  margin: 0;
  color: #212529;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.product-summary {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
  min-width: 0;
}

.product-details h4 {
  margin: 0 0 8px 0;
  color: #212529;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.original-price {
  font-size: 14px;
  color: #6c757d;
}

.price-value {
  font-weight: 600;
  color: #28a745;
  font-size: 16px;
}

.offer-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: inline-block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
  font-size: 14px;
  margin-left: 10px;
}

.form-group input[type="number"] {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
  background: white;
  box-sizing: border-box;
}

.form-group input[type="number"]:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
  outline: none;
}

.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
  background: white;
  box-sizing: border-box;
}

.form-group textarea:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
  outline: none;
}

.price-info {
  margin-top: 8px;
  text-align: right;
}

.savings {
  color: #28a745;
  font-weight: 600;
  font-size: 14px;
}

.character-count {
  text-align: right;
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.4;
  gap: 10px;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}
.form-check-input {
  accent-color: var(--primary-color); /* Pour la plupart des navigateurs modernes */
  width: 1.2em;
  height: 1.2em;
}

/* Pour un style plus personnalisé si besoin */
.form-check-input:checked {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}


.terms-link {
  color: var(--primary-color);
  text-decoration: none;
}

.terms-link:hover {
  text-decoration: underline;
}

.offer-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.btn-secondary {
  padding: 12px 24px;
  border: 1px solid #e9ecef;
  background: white;
  color: #6c757d;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #dee2e6;
  color: #495057;
}

.btn-primary {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.popup-content {
  position: relative;
}

@media (max-width: 480px) {
  .offer-modal {
    width: 95vw;
    max-height: 95vh;
    margin: 20px;
  }
  
  .product-summary {
    flex-direction: column;
    gap: 12px;
  }
  
  .product-image {
    width: 60px;
    height: 60px;
    align-self: flex-start;
  }
  
  .offer-actions {
    flex-direction: column-reverse;
    gap: 8px;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>