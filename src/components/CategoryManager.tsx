import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types/restaurant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { BASE_URL } from '@/components/Api/Api';
import { addCategory, deleteCategory, getCategories } from '@/services/categoryService';

interface CategoryManagerProps {
  onCategoriesChange: () => void;
}

const CategoryManager = ({ onCategoriesChange }: CategoryManagerProps) => {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // دالة مساعدة لاستخراج معلومات التصنيف
  const extractCategoryInfo = (category: any): Category => {
    // البحث عن الاسم في جميع المستويات المحتملة
    const namePaths = [
      'name',
      'title',
      'attributes.name',
      'attributes.title',
      'data.attributes.name',
      'item.name'
    ];

    let categoryName = 'تصنيف جديد';
    for (const path of namePaths) {
      const value = path.split('.').reduce((obj, key) => obj?.[key], category);
      if (value) {
        categoryName = value;
        break;
      }
    }

    return {
      id: category.id?.toString() || category._id?.toString() || Date.now().toString(),
      name: categoryName,
      description: category.description || category.attributes?.description || ''
    };
  };

  // جلب التصنيفات من API
  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getCategories();

      let categoriesData: Category[] = [];
      
      if (Array.isArray(response.data)) {
        categoriesData = response.data.map(extractCategoryInfo);
      } 
      else if (response.data?.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data.map(extractCategoryInfo);
      }
      else if (response.data) {
        categoriesData = [extractCategoryInfo(response.data)];
      }

      setCategories(categoriesData);
      toast({
        title: "تم التحميل",
        description: `تم تحميل ${categoriesData.length} تصنيف`,
      });

    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل التصنيفات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // إضافة تصنيف جديد
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم التصنيف",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await addCategory({
        name: formData.name.trim(),
        description: formData.description.trim()
      });

      toast({
        title: "تم بنجاح!",
        description: `تم إضافة التصنيف "${formData.name}"`,
      });

      setFormData({ name: '', description: '' });
      setShowAddForm(false);
      await loadCategories();
      onCategoriesChange();

    } catch (error) {
      toast({
        title: "خطأ",
        description: axios.isAxiosError(error) 
          ? error.response?.data?.message || "حدث خطأ أثناء الإضافة"
          : "حدث خطأ أثناء الإضافة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // حذف تصنيف
  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${categoryName}"؟`)) return;
    setIsLoading(true);
    try {
      await deleteCategory(categoryId);
      toast({
        title: "تم الحذف",
        description: `تم حذف "${categoryName}"`,
      });
      await loadCategories();
      onCategoriesChange();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف التصنيف",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // تصفية التصنيفات حسب البحث
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">إدارة التصنيفات</CardTitle>
        <CardDescription>يمكنك إضافة أو حذف تصنيفات القائمة</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* شريط البحث */}
        <div className="flex gap-2">
          <Input
            placeholder="ابحث عن تصنيف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* عرض التصنيفات الحالية */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">التصنيفات الحالية:</h4>
            <span className="text-sm text-gray-500">
              {filteredCategories.length} تصنيف
            </span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              {searchTerm ? "لا توجد نتائج بحث" : "لا توجد تصنيفات حالياً"}
            </p>
          ) : (
            <div className="grid gap-2">
              {filteredCategories.map((category) => {
                const relCategory = category as Category & { relationship?: { Items?: any[] } };
                return (
                  <div key={relCategory.id} className="flex flex-col border rounded-lg mb-4">
                    <div className="flex justify-between items-center p-3">
                  <div>
                        <p className="font-medium">{relCategory.name}</p>
                        {relCategory.description && (
                          <p className="text-sm text-gray-500">{relCategory.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                        onClick={() => handleDeleteCategory(relCategory.id, relCategory.name)}
                    disabled={isLoading}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                    </div>
                    {/* عرض المنتجات الخاصة بالتصنيف */}
                    {relCategory.relationship && Array.isArray(relCategory.relationship.Items) && relCategory.relationship.Items.length > 0 && (
                      <div className="bg-gray-50 p-3 border-t">
                        <div className="font-semibold mb-2 text-sm text-gray-700">منتجات هذا التصنيف:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {relCategory.relationship.Items.map((item) => (
                            <div key={item.id} className="p-2 border rounded bg-white flex flex-col">
                              <span className="font-bold">{item.name}</span>
                              <span className="text-xs text-gray-500">السعر: {item.price} ر.س</span>
                              <span className="text-xs text-gray-500">النوع: {item.type}</span>
                      </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* زر إضافة تصنيف جديد */}
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full mt-4"
            variant="outline"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة تصنيف جديد
          </Button>
        )}

        {/* نموذج إضافة التصنيف */}
        {showAddForm && (
          <form onSubmit={handleAddCategory} className="space-y-4 border rounded-lg p-4 mt-4">
            <div>
              <Label htmlFor="categoryName">اسم التصنيف *</Label>
              <Input
                id="categoryName"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="أدخل اسم التصنيف"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="categoryDescription">الوصف (اختياري)</Label>
              <Textarea
                id="categoryDescription"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="أدخل وصفاً للتصنيف"
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                حفظ
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ name: '', description: '' });
                }}
                disabled={isLoading}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryManager;