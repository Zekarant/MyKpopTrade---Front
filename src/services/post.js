import axios from "axios";
import Cookies from "js-cookie";
import { func } from '@/function.js';

const PHPSESSID = Cookies.get('PHPSESSID');
const idUser = Cookies.get('id_user');
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
          Authorization: `Bearer ${PHPSESSID}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
        func.verifSession();
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
          Authorization: `Bearer ${PHPSESSID}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
        func.verifSession();
      }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  },

  // Créer un post
  createPost: async (postData) => {    
    var data = new FormData();
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
    try{
      console.log('PHPSESSID', PHPSESSID);
      await axios.post(`${API_URL}/api/products`, data, {
        headers: {
          Authorization: `Bearer ${PHPSESSID}`,
        }
      }).then(response => {
          if (response.status == 201 || response.status == 200) {
            return true;
          }else {
            return false;
          }

      }).catch(error => {
        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
          func.verifSession();
        }
        return false;
      });
      return true;

    }catch (error) {
      console.error('Erreur lors de la récupération des posts :', error);
      throw error;
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
          Authorization: `Bearer ${PHPSESSID}`,
          "Content-Type": "application/json"
        }
      }).then(response => {
          if (response.status === 200) {
            return true;
          } else {
            return false;
          }
      }).catch(error => {
        console.log(error);
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
          Authorization: `Bearer ${PHPSESSID}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
          func.verifSession();
        }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  },
  
  addFavorite: async (id) => {
    try{
      await axios.post(`${API_URL}/api/products/`+id+'/favorite', {
        buyerId: idUser
      }, {
        headers: {
          Authorization: `Bearer ${PHPSESSID}`,
          "Content-Type": "application/json"
        }
      }).then(response => {
        console.log()
          if (response.status === 200) {
            return true;
          } else {
            return false;
          }
      }).catch(error => {
        console.log(error);
          if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
            func.verifSession();
            addFavorite(id);
          }
        return false;
  
      });


    }catch (error) {
      console.error('Erreur lors de la modifcation du posts :', error);
      throw error;
    }
    
  },
  async getFavorites(limit = 20, page = 1)  {
    try{
      const response = await axios.get(`${API_URL}/api/products/inventory/favorites`, {
        params: {
          limit: limit,
          page: page
        },
        headers: {
          Authorization: `Bearer ${PHPSESSID}`,
          "Content-Type": "application/json"
        }
        
      });
      return response.data;

      
    }catch (error) {
      if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
        func.verifSession();
      }
      throw error;

    }
  },
  getRecommendations: async function ()  {
    let tabRecommendations = [];

    try {
      await axios.get(`${API_URL}/api/products/recommendations/`, {
        headers: {
          Authorization: `Bearer ${PHPSESSID}`,
          "Content-Type": "application/json"
        }
      }).then(response => {
        response.data.products.forEach(async productFav => {
          tabRecommendations.push(productFav);
        })
      }).catch(error => {
        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
          func.verifSession();
        }
        return tabRecommendations;
      });;

    } catch (error) {
      if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
        func.verifSession();
      }

    }
    return tabRecommendations;


  }, 


};
