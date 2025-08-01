import axios from "axios";
import Cookies from "js-cookie";
import { func } from '@/function.js';

const getSessionToken = () => Cookies.get('sessionToken');
const API_URL = import.meta.env.VITE_API_URL;

export default {
  async getUserbyName(name) {
    try {
      const response = await axios.get(`${API_URL}/api/profiles/user/${name}`, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      });
      if(response.data.message == "Token invalide" || response.data.code == "TOKEN_EXPIRED"||response.status == 401){
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
  async getMyInformation() {
    try {
      const response = await axios.get(`${API_URL}/api/profiles/me`, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      });
      if(response.data.message == "Token invalide" || response.data.code == "TOKEN_EXPIRED"||response.status == 401){
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



};
