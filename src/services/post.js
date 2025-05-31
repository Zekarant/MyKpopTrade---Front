import axios from "axios";
import Cookies from "js-cookie";

// Création d'une instance Axios avec une base URL

const PHPSESSID = Cookies.get('PHPSESSID');
const API_URL = import.meta.env.VITE_API_URL;

export default {
  // Récupérer tous les posts
  getPosts() {
    return apiClient.get("/posts");
  },

  // Récupérer un post par ID
  getPost(id) {
    return apiClient.get(`/posts/${id}`);
  },

  // Créer un post
  createPost: async (postData) => {
    console.log('postData', postData.title);
    
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
};
