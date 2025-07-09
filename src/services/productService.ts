import axios from 'axios';
import { BASE_URL } from '@/components/Api/Api';

// جلب كل التصنيفات (بدون token)
export const getCategories = () => {
  return axios.get(`${BASE_URL}/api/user/menuCategories`);
};

// جلب كل العناصر (بدون token)
export const getItems = () => {
  return axios.get(`${BASE_URL}/api/user/items`);
};

// خدمة المنتجات
export const ProductService = {
  getCategories,
  getItems,
  // جلب المنتجات حسب التصنيف
  getProductsByCategory: (categoryId) => {
    return axios.get(`${BASE_URL}/api/user/items?category=${categoryId}`);
  },
  // البحث في المنتجات
  searchProducts: (term) => {
    return axios.get(`${BASE_URL}/api/user/items?search=${term}`);
  }
};

