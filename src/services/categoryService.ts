
import axios from 'axios';
import { BASE_URL } from '@/components/Api/Api';

// جلب كل التصنيفات
export const getCategories = () => {
      const token = localStorage.getItem('token');
  return axios.get(`${BASE_URL}/api/admin/menuCategories`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// إضافة تصنيف جديد
export const addCategory = (data) => {
      const token = localStorage.getItem('token');
  return axios.post(`${BASE_URL}/api/admin/menuCategories`, data, {
              headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
              }
            });
};

// تعديل تصنيف موجود
export const updateCategory = (id, data) => {
  const token = localStorage.getItem('token');
  data._method = 'PUT';
  return axios.post(`${BASE_URL}/api/admin/menuCategories/${id}`, data, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// حذف تصنيف
export const deleteCategory = (id) => {
      const token = localStorage.getItem('token');
  return axios.delete(`${BASE_URL}/api/admin/menuCategories/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
            });
};

// Export as CategoryService object
export const CategoryService = {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
};
