import axios from "axios";

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export const serverAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_API_URL,
});
