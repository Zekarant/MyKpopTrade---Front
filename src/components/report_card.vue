<template>
    <div v-dismiss="close" class="popup-overlay">
        <div ref="dialogEl" class="report-modal" role="dialog" aria-modal="true" :aria-label="title" @click="$event.stopPropagation()">
            <div class="report-modal__header">
                <div class="report-modal__icon">
                    <i class="bi bi-exclamation-triangle"></i>
                </div>
                <h3 class="report-modal__title">{{ title }}</h3>
                <p class="report-modal__subtitle">
                    Aidez-nous à maintenir une communauté sûre
                </p>
            </div>

            <div class="report-modal__body">
                <span :id="`${uid}-reason`" class="report-modal__label">Motif du signalement</span>
                <div class="report-modal__reasons" role="radiogroup" :aria-labelledby="`${uid}-reason`">
                    <label
                        v-for="reason in reasons"
                        :key="reason.value"
                        class="report-modal__reason"
                        :class="{ active: signalReason === reason.value }"
                    >
                        <input v-model="signalReason" type="radio" :value="reason.value" />
                        <i :class="reason.icon"></i>
                        <span>{{ reason.label }}</span>
                    </label>
                </div>

                <label class="report-modal__label" :for="`${uid}-details`">Détails supplémentaires</label>
                <textarea
                    :id="`${uid}-details`"
                    v-model="signalReasonTxt"
                    class="report-modal__textarea"
                    placeholder="Décrivez le problème pour nous aider à comprendre la situation..."
                    rows="3"
                ></textarea>
            </div>

            <div class="report-modal__footer">
                <button class="report-modal__btn report-modal__btn--cancel" @click="close">
                    Annuler
                </button>
                <button
                    class="report-modal__btn report-modal__btn--submit"
                    :disabled="!signalReason"
                    @click="report()"
                >
                    <i class="bi bi-flag"></i>
                    Envoyer le signalement
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { vDismiss } from '@/composables/vDismiss'
    import { computed, ref, useId } from 'vue';
    import { func } from '@/function';
    import reportService, { type ReportTargetType } from '@/services/report.service';
    import { apiErrorMessage } from '@/services/apiError';
    import { useDialogFocus } from '@/composables/useDialogFocus';

    defineOptions({ name: 'ReportCard' });

    const TITLES: Record<ReportTargetType, string> = {
        product: 'Signaler cet article',
        rating: 'Signaler cet avis',
        user: 'Signaler ce profil',
        post: 'Signaler cette publication',
        message: 'Signaler ce message'
    };

    const reasons = [
        { value: 'inappropriate_content', label: 'Contenu inapproprié', icon: 'bi bi-eye-slash' },
        { value: 'offensive_language', label: 'Langage offensant', icon: 'bi bi-chat-left-dots' },
        { value: 'false_information', label: 'Fausses informations', icon: 'bi bi-info-circle' },
        { value: 'spam', label: 'Spam', icon: 'bi bi-envelope-exclamation' },
        { value: 'fraud', label: 'Fraude / Arnaque', icon: 'bi bi-shield-exclamation' },
        { value: 'copyright_violation', label: 'Violation du droit d\'auteur', icon: 'bi bi-c-circle' },
        { value: 'other', label: 'Autre raison', icon: 'bi bi-three-dots' },
    ];

    const props = defineProps<{ type: ReportTargetType; id: string }>();
    const emit = defineEmits<{ closeReport: [] }>();

    const dialogEl = ref<HTMLElement | null>(null);
    useDialogFocus(dialogEl, undefined, () => emit('closeReport'));

    const uid = useId();
    const signalReason = ref('');
    const signalReasonTxt = ref('');

    const title = computed(() => TITLES[props.type] || 'Signaler ce contenu');

    function close() {
        emit('closeReport');
    }

    async function report() {
        if (!signalReason.value) return;
        try {
            await reportService.createReport({
                targetType: props.type,
                targetId: props.id,
                reason: signalReason.value,
                details: signalReasonTxt.value
            });
            func.showToastSuccess('Signalement envoyé avec succès');
            close();
        } catch (error) {
            func.showToastError(apiErrorMessage(error, 'Erreur lors du signalement'));
        }
    }
</script>

<style lang="scss" scoped>
.report-modal {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    max-width: 480px;
    width: 92%;
    max-height: 85vh;
    overflow-y: auto;
    animation: slideUp 0.2s ease;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}

.report-modal__header {
    padding: var(--space-xl) var(--space-xl) var(--space-md);
    text-align: center;
}

.report-modal__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-full);
    background: var(--danger-light);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-md);
    font-size: 1.3rem;
    color: var(--danger);
}

.report-modal__title {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 4px;
}

.report-modal__subtitle {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin: 0;
}

.report-modal__body {
    padding: 0 var(--space-xl);
}

.report-modal__label {
    display: block;
    font-weight: 600;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-sm);
}

.report-modal__reasons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-xs);
    margin-bottom: var(--space-lg);
}

.report-modal__reason {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 10px 12px;
    border: 1.5px solid var(--surface-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--text-primary);

    input[type="radio"] {
        display: none;
    }

    i {
        color: var(--text-muted);
        font-size: 0.9rem;
        flex-shrink: 0;
    }

    &:hover {
        border-color: var(--accent-pink);
    }

    &.active {
        border-color: var(--danger);
        background: color-mix(in srgb, var(--danger) 5%, transparent);

        i {
            color: var(--danger);
        }
    }
}

.report-modal__textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    background: var(--bg-primary);
    resize: vertical;
    min-height: 80px;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

    &:focus {
        outline: none;
        border-color: var(--accent-pink);
        box-shadow: var(--focus-ring);
    }

    &::placeholder {
        color: var(--text-muted);
    }
}

.report-modal__footer {
    display: flex;
    gap: var(--space-sm);
    padding: var(--space-lg) var(--space-xl) var(--space-xl);
}

.report-modal__btn {
    flex: 1;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all var(--transition-fast);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);

    &--cancel {
        background: var(--surface-hover);
        color: var(--text-secondary);

        &:hover {
            background: var(--surface-active);
            color: var(--text-primary);
        }
    }

    &--submit {
        background: var(--danger);
        color: var(--text-on-accent);

        &:hover:not(:disabled) {
            background: var(--danger);
            transform: translateY(-1px);
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
}

@media (max-width: 500px) {
    .report-modal__reasons {
        grid-template-columns: 1fr;
    }
}
</style>
