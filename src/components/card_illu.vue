<template>
    <div class="container">
      <div class="wrapper">
        <div class="card_ill">
          <div :style="{ backgroundImage: `url(${frontImage})` }" class="card-front"></div>
          <div :style="{ backgroundImage: `url(${backImage})` }" class="card-back"></div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  export default {

    name: "card_illu",

    props: {
        frontImage: {
            type: String,
            required: true,
        },
        backImage: {
            type: String,
            required: true,
        },
    },
  };

  </script>
  
  <style lang="scss" scoped>
  .container {
    width: 100%;
    height: 100%;
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    justify-content: center;
    align-items: center;
    overflow: auto;
  }
  
  .wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    background: var(--primary-color);
  }
  
  .card_ill {
    width: 80%;
    height: 80%;

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding-bottom: 43%; /* Maintient un ratio pour les cartes */
    perspective: 1000px; /* Donne une profondeur plus marquée */
    transform-style: preserve-3d; /* Assure que les enfants de la carte respectent la 3D */
    transition: transform 0.5s ease, box-shadow 0.5s ease;
    border-radius: 10px;

    &:hover {
      .card-front {
        transform: rotateY(180deg);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); /* Ombre réaliste */

      }
      .card-back {
        transform: rotateY(360deg);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); /* Ombre réaliste */

      }
    }
  
    .card-front,
    .card-back {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      background-size: 100% 100%;
      background-position: center center;
      background-repeat: no-repeat;
      backface-visibility: hidden;
      transition: all 1s;
      border-radius: 10px;

    }
  
    .card-front {
      transform: rotateY(0deg);
    }
  
    .card-back {
      transform: rotateY(180deg);
    }
  }
  </style>
  