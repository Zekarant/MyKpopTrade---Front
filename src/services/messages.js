import axios from "axios";
import Cookies from "js-cookie";
import { func } from '@/function.js';

const PHPSESSID = Cookies.get('PHPSESSID');
const idUser = Cookies.get('id_user');
const API_URL = import.meta.env.VITE_API_URL;

export default {
  async getMessagesList() {
    try {
      const response = await axios.get(`${API_URL}/api/messaging`, {
        headers: {
          Authorization: `Bearer ${PHPSESSID}`,
          "Content-Type": "application/json"
        }
      });
      if(response.data.message == "Token invalide" || response.data.code == "TOKEN_EXPIRED" || response.status == 401){
        func.verifSession();
      }
      return response.data;
    } catch (error) {
      if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
        func.verifSession();
      }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  },


  createConversation: async (recipientId,productId=null,initialMessage) => {    
    var data = {
      'recipientId': recipientId,
      'initialMessage': initialMessage,
    };
    if(productId){
      data['productId'] = productId;
    }
      await axios.post(`${API_URL}/api/messaging`, data, {
        headers: {
          Authorization: `Bearer ${PHPSESSID}`,
          "Content-Type": "application/json"
        }
      }).then(response => {
          if(response.data.message == "Token invalide" ||response.data.code == "TOKEN_EXPIRED"|| response.status == 401){
            func.verifSession().then(rep =>{
              this.createConversation(recipientId,productId,initialMessage);
            });
          }
          if(response.status === 200 || response.status === 201){ 
            return true;
          }else{
            return false;
          }
          
      })


  },

};
