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
    try{
      console.log('PHPSESSID', PHPSESSID);
      await axios.post(`${API_URL}/api/products`, postData, {
        headers: {
          Authorization: `Bearer ${PHPSESSID}`,
          "Content-Type": "application/json"
        }
      }).then(response => {
          console.log(response);
          if (response.status === 200) {
            console.log(response);
            return true;
          } else {
            return false;
          }
      }).catch(error => {
        console.log(error);
        return false;
  
      });
      return false;

    }catch (error) {
      console.error('Erreur lors de la récupération des posts :', error);
      throw error;
    }


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
