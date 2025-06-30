<template>
    <div class="nav" :class="{ 'nav-open': menuOpen }">
        <input type="checkbox" id="nav-check" v-model="menuOpen">
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
        </div>
        <div @click="togglePopup" class="nav-links-center">
            <img src="@/assets/images/add.svg" class="add_post" alt="add post" />
        </div>
        <div class="nav-links-end">
            <a @click="togglePopup" class="btn_add_mobile" href="#">Vendre</a>

            <!--<a v-on:click="navPage(menu.page, menu.parameter)" :class="{ active: menu.active }"  v-for="menu in itemMenuEnd" href="#">{{menu.label}}</a>-->
            <a v-on:click="$func.logout()" class="logout" href="#">Déconnexion</a>

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
                menuOpen: false,
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
                itemMenuEnd: [
                    {
                    },            
                    {

                    },            
                    {
     
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
                    if (btn === 'profile') {
                        if (this.route.params?.id === 'me' || this.route.params?.parameter === 'me') {
                            return true;
                        }
                        return false;
                    }
                    return true;
                }
                return false;
            },
            navPage(page:RouteRecordNameGeneric, parameter: any){
                
                this.closeMenu();
                setTimeout(() => {
                    this.router.push({ name: page , params: { id: parameter }});
                }, 0);


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

.nav > .nav-links-first, .nav > .nav-links-end {
    z-index: 8;
    display: inline;
    float: right;
    font-size: 18px;
    width:47%;
    height: 100%;
    background: white;
}
.nav > .nav-links-end {
    text-align: end;
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


.nav > .nav-links-first > a, .nav > .nav-links-end > a {
  display: inline-block;
  padding: 13px 10px 13px 10px;
  text-decoration: none;
  color: #D2D6DE;
  font-family:Sora;
}

.nav > .nav-links-first > a.active, nav > .nav-links-end > a.active  {
    color: var(--primary-color)
}

.nav > .nav-links-first > a:hover, nav > .nav-links-end > a:hover {
    color: var(--primary-color)
}
.nav > .nav-links-end > a.logout{
    color: var(--danger-color) ;
}

.nav > #nav-check {
  display: none;
}

@media (max-width:600px) {
    
    .nav {
        z-index: 8;
    }
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

    .nav > .nav-links-center{
        width: 0px;
    }
    .nav > .nav-btn > label > span {
        display: block;
        width: 25px;
        height: 10px;
        border-top: 2px solid var(--primary-color);
    }
    .nav > .nav-links-first{
        position: absolute;
        display: block;
        height: auto;
        width: 100%;
        transition: all 0.3s ease-in;
        overflow-y: auto;
        top: 50px;
        left: 0px;
        text-align: center;
        padding-bottom: 60px; 
        z-index: 9;
        background: #fff;
    }
    .nav > .nav-links-end {
        display: flex ;
        flex-direction: column;
        justify-content: flex-end;
        align-items: stretch;
        overflow-y: auto;
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        min-height: auto; 
        height: auto;  
        text-align: center;
        padding-bottom: 20px;
    }
    .nav > .nav-links-end > a {
        width: 100%;
    }
    .nav > .nav-links-first > a, .nav > .nav-links-end > a {
        display: block;
        width: 100%;
    }
    .nav-links-center{
        height: auto !important;
    }
    .add_post{
        display: none
    }
    .btn_add_mobile{
        display:block !important;
        position:relative;
        bottom:0px;
    }
    .nav > .nav-links-first, .nav > .nav-links-end {
        display: none;
    }
    .nav > #nav-check:checked ~ .nav-links-first, .nav > #nav-check:checked ~ .nav-links-end {
        display: block;
    }
    .nav > #nav-check:checked ~ .nav-links-end {
        display: flex !important;
        flex-direction: column;
    }
    .nav > #nav-check:checked ~ body{
        overflow: hidden !important;
    }

    .nav.nav-open {
        min-height: 100vh;
        position: fixed;
    }


}

</style>