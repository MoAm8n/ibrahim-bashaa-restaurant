import { useState, useEffect } from 'react';
import { Category } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { BASE_URL } from '@/components/Api/Api';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

interface ApiCategory {
  id?: string | number;
  _id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  attributes?: {
    name?: string;
    title?: string;
    description?: string;
  };
}

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCategoriesFromAPI = async () => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/admin/menuCategories`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // دالة مساعدة لاستخراج الاسم من أي هيكل بيانات
      const extractName = (category: unknown): string => {
        const namePaths = [
          'name',
          'title',
          'attributes.name',
          'attributes.title',
          'data.name',
          'data.title'
        ];

        for (const path of namePaths) {
          const value = path.split('.').reduce((obj, key) => obj?.[key], category);
          if (value) return value;
        }

        return 'تصنيف جديد';
      };

      // دالة مساعدة لاستخراج المعرف
      const extractId = (category: any): string => {
        return category.id?.toString() || 
               category._id?.toString() || 
               Date.now().toString();
      };

      // معالجة البيانات بغض النظر عن هيكلها
      let processedCategories: Category[] = [];
      
      if (Array.isArray(response.data)) {
        processedCategories = response.data.map((cat: ApiCategory) => ({
          id: extractId(cat),
          name: extractName(cat),
          description: cat.description || ''
        }));
      } 
      else if (response.data?.data && Array.isArray(response.data.data)) {
        processedCategories = response.data.data.map((cat: ApiCategory) => ({
          id: extractId(cat),
          name: extractName(cat),
          description: cat.description || ''
        }));
      }
      else {
        // إذا كانت البيانات ليست مصفوفة
        processedCategories = [{
          id: extractId(response.data),
          name: extractName(response.data),
          description: response.data.description || ''
        }];
      }

      setCategories(processedCategories);

    } catch (error) {
      // تصنيفات افتراضية في حالة الخطأ
      setCategories([
        { id: '1', name: 'الوجبات الرئيسية', description: '' },
        { id: '2', name: 'المقبلات', description: '' },
        { id: '3', name: 'المشروبات', description: '' }
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategoriesFromAPI();
    
    const handleCategoriesUpdated = () => {
      loadCategoriesFromAPI();
    };
    
    window.addEventListener('categoriesUpdated', handleCategoriesUpdated);
    
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdated);
    };
  }, []);

  const handleRefresh = () => {
    loadCategoriesFromAPI();
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="outline" disabled>
            جاري تحميل التصنيفات...
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-3 justify-center items-center">
        <Button
          onClick={() => onCategoryChange(null)}
          variant={selectedCategory === null ? 'default' : 'outline'}
        >
          عرض الكل
        </Button>
        
        {categories.map((category) => (
          <Button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
          >
            {category.name}
          </Button>
        ))}
      </div>
      
      <div className="text-center mt-2 text-sm text-gray-500">
        عدد التصنيفات المتاحة: {categories.length}
      </div>
    </div>
  );
};

export default CategoryFilter;