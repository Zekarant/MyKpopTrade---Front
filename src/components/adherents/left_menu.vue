<template>
    <div class="contain_menu_mobile">
        <div class="btnResponsiveMenu" @click="devMenu()"><i class="bi bi-list"></i></div>
    </div>
    <div @click="closeMenu()"></div>
    <nav class="main-menu" :class="showFullMenu ? 'show-menu' : 'no-menu'" style="text-align: center;">
        <div class="btnResponsiveMenu" @click="closeMenu()"><i class="bi bi-x"></i></div>
        <ul>

            <li class="has-subnav btnMenuSide" v-for="item in itemMenu">
                <a @click="navPage(item.page)" class="" :class="{ btnActive:  item.active}">
                    <div class="containerItemSideMenu" v-html="item.icon"></div>
                    <span class="nav-text">
                        {{item.label}}
                    </span>
                </a>
                      
            </li>
      
        </ul>
        

    </nav>
</template>


<script lang="ts">
import type { RouteRecordNameGeneric } from 'vue-router';


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
                    page: 'Dashboard',

                    },            
                    {
                    label: 'Ma collection',
                    icon: '<i class="bi bi-person-arms-up"></i>',
                    active: this.verifBtn('Base'),
                    page: 'Base',

                    }
                ],
                showFullMenu:false    
            };
        },
        mounted() {
            this.currentRoute = this.$route.name as string;
        },
        methods: {
            verifBtn(btn:RouteRecordNameGeneric){
                console.log(btn);
                console.log(this.$route.name);
                
                if( this.$route.name == btn)
                {
                    return true;
                }
                return false;
            },
            navPage(page:RouteRecordNameGeneric){
                this.closeMenu();
                this.$router.push({ name: page });
            },
            devMenu(){
                this.showFullMenu = true;
            },
            closeMenu(){
                this.showFullMenu = false;
            },
        
        
        },

    };

</script>
<style>
    .main-menu{
        position: fixed;
    }
    .btnMenuSide{
        padding-top: 8px;
        padding-bottom: 8px;
    }

    .btnMenuSide:hover{
        background-color: var(--primary-color);
        color: white !important;
        border-radius: 10px;
        width: 80%;
        position: relative;
    }

</style>