<template>
    <div v-if="isRoot" class="responseReviewContent">
        <div v-if="review.response.content && !isEditing" class="response-display">
            <p class="response-text">{{ review.response.content }}</p>
            <button @click="isEditing = true" class="btn-edit"><i class="bi bi-pencil"></i> Modifier</button>
        </div>
        <div v-if="!review.response.content || isEditing">
            <textarea v-model="textResponse" :placeholder="review.response.content ? 'Modifier votre réponse...' : 'Répondre à cet avis...'" @keyup="showSendResponseBtn = true"></textarea>
            <div class="response-actions">
                <button v-if="isEditing" @click="isEditing = false" class="btn-cancel-edit">Annuler</button>
                <button v-if="showSendResponseBtn && !review.response.content" @click="response" class="btn-primary">Répondre</button>
                <button v-if="showSendResponseBtn && review.response.content" @click="modify" class="btn-primary">Enregistrer</button>
            </div>
        </div>
    </div>
    <div v-else-if="!isRoot && review.response.content" class="responseReviewContent">
        <p class="response-text">{{ review.response.content }}</p>
    </div>
</template>

<script lang="ts">
    import axios from 'axios';
    import Cookies from "js-cookie";
    const sessionToken = Cookies.get('sessionToken');
    const id_user = Cookies.get('id_user');
    import authentificationService from "../../src/services/authentification.service";
    export default {
        name: "response_review",
        components: {
        },
        props: {
            review: {
                type: Object,
                required: true,
            },
            index:{
                type: Number,
                required: true,
            }
        },
        data() {
            return {
                textResponse: '',
                showSendResponseBtn: false,
                isRoot: false,
                isEditing: false
            };
        },
        methods: {
            async response(){
                await axios.post(`${import.meta.env.VITE_API_URL}/api/profiles/ratings/${this.review._id}/response`, {
                    response: this.textResponse
                }, {
                    headers: {
                    Authorization: `Bearer ${sessionToken}`,
                    }
                }).then(response => {
                    if (response.status == 201 || response.status == 200) {
                        this.$func.showToastSuccess(response.data.message);
                        this.showSendResponseBtn = false;
                        this.isEditing = false;
                        this.$emit('update-review', {
                            review: { ...this.review, response: { ...this.review.response, content: this.textResponse } },
                            index: this.index
                        });
                    }else {
                        this.$func.showToastError(response);
                        console.error("Error reporting review:", response);
                    }
                })
            },
            async modify(){
                if(this.textResponse != ''){
                    await axios.put(`${import.meta.env.VITE_API_URL}/api/profiles/ratings/${this.review._id}/response`, {
                        response: this.textResponse
                    }, {
                        headers: {
                        Authorization: `Bearer ${sessionToken}`,
                        }
                    }).then(response => {
                        if (response.status == 201 || response.status == 200) {
                            this.$func.showToastSuccess(response.data.message);
                            this.showSendResponseBtn = false;
                            this.$emit('update-review', {
                                review: { ...this.review, response: { ...this.review.response, content: this.textResponse } },
                                index: this.index
                            });
                        }else {
                            this.$func.showToastError(response);
                            console.error("Error reporting review:", response);
                        }
                    })
                }else{
                    axios.delete(`${import.meta.env.VITE_API_URL}/api/profiles/ratings/${this.review._id}/response`, {
                        headers: {
                            'Authorization': `Bearer ${sessionToken}`,
                        },
                    }).then((response) => {
                        if (response.status == 201 || response.status == 200) {
                            this.$func.showToastSuccess(response.data.message);
                            this.showSendResponseBtn = false;
                            this.$emit('update-review', {
                                review: { ...this.review, response: { ...this.review.response, content: '' } },
                                index: this.index
                            });
                        }else {
                            this.$func.showToastError(response);
                            console.error("Error reporting review:", response);
                        }
                    })
                    .catch((error) => {
                        console.error(error);
                        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                            authentificationService.verifSession();
                        }
                    });
                }
            }
        },
        mounted() {
            if(this.review.recipient === id_user){
                this.isRoot = true;
            }
            if(this.review.response.content){
                this.textResponse = this.review.response.content;
            }
        },
    };
</script>

<style lang="scss" scoped>
    .responseReviewContent{
        position: absolute;
        bottom: 5px;
        left: 10px;
        padding: 10px;
    }
    .responseReviewContent textarea {
        height: 70px;
        width: 100%;
        background: var(--bg-tertiary);
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-md);
        padding: var(--space-sm);
        color: var(--text-primary);
        font-size: var(--font-size-xs);
        font-family: var(--font-sans);
        resize: none;

        &::placeholder { color: var(--text-muted); }
        &:focus {
            outline: none;
            border-color: var(--accent-pink);
        }
    }
    .response-text {
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.4;
    }
    .response-actions {
        display: flex;
        gap: var(--space-sm);
        margin-top: var(--space-sm);
    }
    .btn-primary {
        font-size: var(--font-size-xs);
        padding: var(--space-xs) var(--space-sm);
        background: var(--accent-gradient);
        border: none;
        border-radius: var(--radius-md);
        color: white;
        font-weight: 600;
        cursor: pointer;
    }
    .btn-edit {
        font-size: var(--font-size-xs);
        padding: var(--space-xs) var(--space-sm);
        background: transparent;
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-md);
        color: var(--text-muted);
        cursor: pointer;
        margin-top: var(--space-sm);

        &:hover { color: var(--text-primary); background: var(--bg-tertiary); }
    }
    .btn-cancel-edit {
        font-size: var(--font-size-xs);
        padding: var(--space-xs) var(--space-sm);
        background: transparent;
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-md);
        color: var(--text-muted);
        cursor: pointer;

        &:hover { color: var(--text-primary); }
    }
</style>
