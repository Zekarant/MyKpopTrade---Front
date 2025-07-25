import axios from "axios";
import Cookies from "js-cookie";
import { func } from '@/function.js';

const getSessionToken = () => Cookies.get('sessionToken');
const getidUser = () => Cookies.get('id_user');
const API_URL = import.meta.env.VITE_API_URL;

export default {
  // Récupérer tous les posts
  async getPosts(limit = 20, page = 1, kpopGroup = null, type = 'photocard') {
    ///api/products?page=1&limit=20&kpopGroup=BTS&type=photocard
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        params: {
          limit: limit,
          page: page,
          kpopGroup: kpopGroup,
          type: type
        },
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
        func.verifSession().then(() => {
          this.getPosts(limit, page, kpopGroup, type);
        });
      }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  },

  // Récupérer un post par ID
  async getPost(id) {
    try {
      const response = await axios.get(`${API_URL}/api/products/${id}`, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
        func.verifSession().then(() => {
          this.getPost(id);
        });
      }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  },

  // Créer un post
  createPost: async (postData) => {
  const data = new FormData();
  data.append('title', postData.title);
  data.append('description', postData.description);
  data.append('price', postData.price);
  data.append('currency', postData.currency);
  data.append('condition', postData.condition);
  data.append('category', postData.category);
  data.append('type', postData.type);
  data.append('kpopGroup', postData.kpopGroup);
  data.append('kpopMember', postData.kpopMember);
  data.append('albumName', postData.albumName);
  postData.images.forEach((file) => {
    data.append('productImages', file);
  });
  data.append('shippingOptions', JSON.stringify(postData.shippingOptions));

  try {
    const response = await axios.post(`${API_URL}/api/products`, data, {
      headers: {
        Authorization: `Bearer ${getSessionToken()}`,
      },
    });

    if (response.status === 201 || response.status === 200) {
      return 'ok';
    } else {
      return response;
    }

  } catch (error) {
    const res = error.response;

    if (res && (res.data?.message === "Token invalide" || res.data?.code === "TOKEN_EXPIRED" || res.status === 401)) {

      func.verifSession();
    }

    return res.data;
  }
},
  updateImagesPost: async (images) => {
    images.forEach(image => {
      
    });

  },

 sold: async (idUser, id) => {
    try{
      await axios.post(`${API_URL}/api/products/`+id+'/sold/', {
        buyerId: idUser
      }, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      }).then(response => {
          if (response.status === 200) {
            return true;
          } else {
            return false;
          }
      }).catch(error => {
        return false;
  
      });
      return true;

    }catch (error) {
      console.error('Erreur lors de la modifcation du posts :', error);
      throw error;
    }


  },
  search: async (query,maxPrice=null, minPrice=null, type = null) => {
    let tabParam = {
      search: query,
      limit: 12
    }
    if(minPrice && minPrice !== 'null'){
      tabParam['minPrice'] = minPrice;
    }
    if(maxPrice && maxPrice !== 'null'){
      tabParam['maxPrice'] = maxPrice;
    }
    if(type && type !== 'null'){
      tabParam['type'] = type;
    }

    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        params: tabParam,
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
          func.verifSession().then(() => {
            this.search(query,maxPrice,minPrice,type);
          });
        }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  },
  
  addFavorite: async (id) => {

    try{
      await axios.post(`${API_URL}/api/products/`+id+'/favorite', {
        buyerId: getidUser()
      }, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      }).then(response => {
          if (response.status === 200) {
            return true;
          } else {
            return false;
          }
      }).catch(error => {
          if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
            func.verifSession().then(() => {
              this.addFavorite(id);
            });
          }
        return false;
  
      });


    }catch (error) {
      console.error('Erreur lors de la modifcation du posts :', error);
      throw error;
    }
    
  },
  async getFavorites(limit = 20, page = 1)  {
    try {
      const response = await axios.get(`${API_URL}/api/products/inventory/favorites`, {
        params: {
          limit: limit,
          page: page
        },
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
        func.verifSession().then(() => {
          this.getFavorites(limit, page);
        });
        
      }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  },
  getRecommendations: async function ()  {
    let tabRecommendations = [];

    try {
      await axios.get(`${API_URL}/api/products/recommendations/`, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      }).then(response => {
        response.data.products.forEach(async productFav => {
          tabRecommendations.push(productFav);
        })
      }).catch(error => {
        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
          func.verifSession().then(() => {
            this.getRecommendations();
          });
        }
        return tabRecommendations;
      });;

    } catch (error) {
      if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
        func.verifSession().then(() => {
          this.getRecommendations();
        });
      }

    }
    return tabRecommendations;


  }, 


};
