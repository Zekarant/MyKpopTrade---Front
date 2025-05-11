<template>
    <div class="nav">
        <input type="checkbox" id="nav-check">
        <div class="nav-header"></div>
        <div class="nav-btn">
            <label for="nav-check">
                <span></span>
                <span></span>
                <span></span>
            </label>
        </div>
        <div class="nav-links-first">
            <div class="content-title">
                <!--<img  style="display:inline-block;" src="@/assets/images/logo.png" class="logo-img" alt="Logo" />-->
                <span class="main-title ms-3">
                    K-TRADE
                </span>
            </div>
            <a v-on:click="navPage(menu.page, menu.parameter)" :class="{ active: menu.active }"  v-for="menu in itemMenu" href="#">{{menu.label}}</a>
            <a @click="togglePopup" class="btn_add_mobile" href="#">Vendre</a>
        </div>
        <div @click="togglePopup" class="nav-links-center">
            <img src="@/assets/images/add.svg" class="add_post" alt="add post" />
        </div>
        <div class="nav-links-end">
        </div>
    </div>
</template>


<script lang="ts">
import type { RouteRecordNameGeneric } from 'vue-router';
import { useRoute, useRouter } from "vue-router";

    export default {
        name: "left_menu",
        data() {
            return {
                
                currentRoute: '',
                itemMenu: [
                    {
                    label: 'Menu',
                    icon: '<i class="bi bi-house"></i>',
                    active: this.verifBtn('dashboard'),
                    page: 'dashboard',
                    parameter: null

                    },            
                    {
                    label: 'Mon profil',
                    icon: '<i class="bi bi-collection"></i>',
                    active: this.verifBtn('profile'),
                    page: 'profile',
                    parameter: 'me'
                    },
                    {

                    }
                ],
                showFullMenu:false    
            };
        },
        setup() {
            const route = useRoute();
            const router = useRouter();

            const id = route.params.id; // Récupère l'ID passé en paramètre
            return {
                route,
                router,
                id
            };
        },
        mounted() {
            this.currentRoute = this.route.name as string;
        },
        methods: {
            verifBtn(btn:RouteRecordNameGeneric){                
                if( this.route.name == btn)
                {
                    return true;
                }
                return false;
            },
            navPage(page:RouteRecordNameGeneric, parameter: any){
                
                this.closeMenu();
                this.router.push({ name: page , params: { id: parameter }});

            },
            devMenu(){
                this.showFullMenu = true;
            },
            closeMenu(){
                this.showFullMenu = false;
            },
            togglePopup() {
                this.$emit('toggle-popup-add');
            },
        
        
        },

    };

</script>
<style lang="scss" scoped>
* {
  box-sizing: border-box;
}

body {
  margin: 0px;
  font-family: 'segoe ui';
}

.nav {
  height: 50px;
  width: 100%;
  background-color: #fff;
  box-shadow: 0px 1px 5px #D2D6DE;
  position: relative;
}
.main-title{
    font-family: Rethink Sans;
    font-size: 24px;
    font-weight: 800;
    line-height: 31.25px;
    letter-spacing: 0.05em;
    text-align: left;
    text-underline-position: from-font;
    text-decoration-skip-ink: none;
    display: inline-block;
    color: var(--primary-color)
}
.content-title{
    display:inline; 
    margin-right: 10px;
}

.nav > .nav-header {
  display: inline;
}

.nav > .nav-header > .nav-title {
  display: inline-block;
  font-size: 22px;
  color: #fff;
  padding: 10px 10px 10px 10px;
}

.nav > .nav-btn {
  display: none;
}

.nav > .nav-links-first {
    z-index: 9;
    display: inline;
    float: right;
    font-size: 18px;
    width:48%;
    height: 100%;
    background: white;
}
.nav > .nav-links-center {
    width:5%;
    display: flex;
    align-items: center;
    height: 100%

}
.add_post{
    display: block;
    margin-right:auto;
    margin-left:auto;
}
.btn_add_mobile{
    display:none !important;
}
.nav > .nav-links-end {
  width:25%;
  height: 100%

}

.nav > .nav-links-first > a {
  display: inline-block;
  padding: 13px 10px 13px 10px;
  text-decoration: none;
  color: #D2D6DE;
  font-family:Sora;
}
.nav > .nav-links-first > a.active {
    color: var(--primary-color)
}

.nav > .nav-links-first > a:hover {
    color: var(--primary-color)
}

.nav > #nav-check {
  display: none;
}

@media (max-width:600px) {
  .nav > .nav-btn {
    display: inline-block;
    position: absolute;
    right: 0px;
    top: 0px;
  }
    .content-title{
        display:none; 
    }
    .nav > .nav-btn > label {
        display: inline-block;
        width: 50px;
        height: 50px;
        padding: 13px;
    }
    .nav > .nav-btn > label:hover,.nav  #nav-check:checked ~ .nav-btn > label {
    }
    .nav > .nav-btn > label > span {
        display: block;
        width: 25px;
        height: 10px;
        border-top: 2px solid var(--primary-color);
    }
    .nav > .nav-links-first {
        position: absolute;
        display: block;
        width: 100%;
        height: 0px;
        transition: all 0.3s ease-in;
        overflow-y: hidden;
        top: 50px;
        left: 0px;
        text-align:center
    }
    .nav > .nav-links-first > a {
        display: block;
        width: 100%;
    }
    .nav > #nav-check:not(:checked) ~ .nav-links-first {
        height: 0px;
    }
    .nav > #nav-check:checked ~ .nav-links-first {
        height: calc(100vh - 50px);
        overflow-y: auto;
    }
    .add_post{
        display: none
    }
    .btn_add_mobile{
        display:block !important;
        position:absolute;
        bottom:0px;
    }
}

</style>