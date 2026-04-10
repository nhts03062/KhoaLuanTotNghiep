import { useAuthStore } from "@/stores/auth.store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const instance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
instance.interceptors.request.use(
  async function (config) {
    let token = useAuthStore.getState().accessToken;

    if (!token) {
      token = await AsyncStorage.getItem("access_token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  function (response) {
    return response?.data ?? response;
  },
  async function (error) {
    if (error?.response?.status === 401) {
      await useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);

export default instance;
