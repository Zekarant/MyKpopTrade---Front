<template>
    <div v-if="isRoot" class="responseReviewContent">
        <textarea v-model="textResponse" @keyup="showSendResponseBtn = true"></textarea>
        <button  v-if="showSendResponseBtn && !review.response.content" @click="response" class="btn-primary">Répondre</button>
        <button  v-if="showSendResponseBtn && review.response.content" @click="modify" class="btn-primary">Modifier</button>
    </div>
    <div v-else-if="!isRoot" class="responseReviewContent">
        <div>{{ textResponse }}</div>
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
                isRoot: false

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
                        this.review.response.content = this.textResponse;
                        this.$emit('update-review', { review: this.review, index: this.index }); 


                    }else {
                        this.$func.showToastError(response);
                        console.error("Error reporting review:", response);
                    }

                }).catch(error => {
                    //return false;
                });
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
                            this.review.response.content = this.textResponse;
                            this.$emit('update-review', { review: this.review, index: this.index });
                        }else {
                            this.$func.showToastError(response);
                            console.error("Error reporting review:", response);
                        }

                    }).catch(error => {
                        //return false;
                    });
                }else{
                    axios.delete(`${import.meta.env.VITE_API_URL}/api/profiles/ratings/${this.review._id}/response`, {
                        headers: {
                            'Authorization': `Bearer ${sessionToken}`,
                        },
                    }).then((response) => {
                        if (response.status == 201 || response.status == 200) {
                            this.$func.showToastSuccess(response.data.message);
                            this.showSendResponseBtn = false;
                             this.review.response.content = '';
                            this.$emit('update-review', { review: this.review, index: this.index });
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
        border: 2px solid var(--secondary-color-tint);
    }
    textarea:focus{
        outline: none;
    }
    .btn-primary{
        margin-top: 10px;
        width: 100%;
        font-size: x-small;
    }
  </style>
  