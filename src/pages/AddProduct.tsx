import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Plus, Save, Image, Thermometer, Snowflake, Utensils } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '@/components/Api/Api';
import CategoryManager from '@/components/CategoryManager';

interface AddProductProps {
  editProduct?: Product | null;
  onProductSaved?: () => void;
}

export const PRODUCT_TYPES = ['أكل', 'ساخن', 'بارد'] as const;

export const PRODUCT_TYPE_ICONS: Record<string, JSX.Element> = {
  'ساخن': <Thermometer className="w-4 h-4 text-red-500" />,
  'بارد': <Snowflake className="w-4 h-4 text-blue-500" />,
  'أكل': <Utensils className="w-4 h-4 text-green-500" />,
};

const AddProduct = ({ editProduct, onProductSaved }: AddProductProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: editProduct?.name || '',
    description: editProduct?.description || '',
    price: editProduct?.price?.toString() || '',
    category: editProduct?.category || '',
    type: editProduct?.type || '',
    image: editProduct?.image || ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
  
      const response = await axios.get(`${BASE_URL}/api/admin/menuCategories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      // الطريقة الأكثر دقة لاستخراج التصنيفات
      let categoriesData = [];
      
      // الحالة 1: إذا كانت البيانات تحتوي على مصفوفة مباشرة
      if (Array.isArray(response.data)) {
        categoriesData = response.data;
      }
      // الحالة 2: إذا كانت البيانات تحتوي على كائن به خاصية data
      else if (response.data?.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      }
      // الحالة 3: إذا كانت البيانات تحتوي على كائن به خاصية items
      else if (response.data?.items && Array.isArray(response.data.items)) {
        categoriesData = response.data.items;
      }
      // الحالة 4: إذا كانت الاستجابة تحتوي على كائن واحد فقط
      else if (response.data) {
        categoriesData = [response.data];
      }
  
      // معالجة البيانات لاستخراج الأسماء بشكل صحيح
      const formattedCategories = categoriesData.map((cat: any) => {
        // البحث عن الاسم في المستويات المختلفة
        const categoryName = 
          cat.name || 
          cat.title || 
          cat.attributes?.name || 
          cat.attributes?.title || 
          cat.data?.attributes?.name ||
          'تصنيف جديد'; // قيمة افتراضية إذا لم يوجد اسم
  
        return {
          id: cat.id || cat._id || Date.now().toString(),
          name: categoryName,
          description: cat.description || ''
        };
      });
  
      setCategories(formattedCategories);
  
    } catch (error) {
      // تصنيفات افتراضية للطوارئ
      setCategories([
        { id: '1', name: 'الأطباق الرئيسية', description: '' },
        { id: '2', name: 'المقبلات', description: '' },
        { id: '3', name: 'المشروبات', description: '' }
      ]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price || !formData.category) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (imageSource === 'url' && formData.image) {
      if (
        !formData.image.startsWith('http://') &&
        !formData.image.startsWith('https://') &&
        !formData.image.startsWith('www.')
      ) {
        toast({
          title: "رابط غير معتاد",
          description: "يفضل إدخال رابط يبدأ بـ http أو https أو www. لضمان ظهور الصورة بشكل صحيح.",
          variant: "destructive"
        });
        return;
      }
      // تنبيه فقط إذا بدأ بـ www وليس http أو https
      if (formData.image.startsWith('www.')) {
        toast({
          title: "تنبيه",
          description: "قد لا تظهر الصورة إذا لم يبدأ الرابط بـ http أو https.",
          variant: "default"
        });
      }
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "سعر غير صحيح",
        description: "يرجى إدخال سعر صحيح",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('غير مصرح لك بإضافة منتجات');

      let dataToSend: FormData | object;
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': selectedFile ? 'multipart/form-data' : 'application/json'
        }
      };

      const url = editProduct
        ? `${BASE_URL}/api/admin/items/${editProduct.id}` 
        : `${BASE_URL}/api/admin/items`;
      const method = editProduct ? 'put' : 'post';
      
      if (selectedFile) {
        const form = new FormData();
        form.append('name', formData.name.trim());
        form.append('description', formData.description.trim());
        form.append('price', price.toString());
        form.append('category_id', Number(formData.category).toString());
        form.append('type', PRODUCT_TYPES.find(type => type === formData.type)?.toLowerCase() || 'food');
        form.append('image', selectedFile);
        dataToSend = form;
        config.headers['Content-Type'] = 'multipart/form-data';
      } else {
        // إذا لم يكن هناك صورة مرفوعة
        dataToSend = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: price.toString(),
          category_id: Number(formData.category),
          type: PRODUCT_TYPES.find(type => type === formData.type)?.toLowerCase() || 'food',
        image_url: formData.image.trim() || ''
        };
        config.headers['Content-Type'] = 'application/json';
      }
      const response = await axios.post(url, dataToSend, config);
      if (response.data) {
        toast({
          title: "تم بنجاح!",
          description: `تم ${editProduct ? 'تحديث' : 'إضافة'} "${formData.name}" بنجاح`,
        });
        if (onProductSaved) onProductSaved();
        else navigate('/manage-products');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        let errorMessage = "حدث خطأ أثناء حفظ المنتج";
        errorMessage = error.response?.data?.message || error.message;
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ في نوع الملف",
        description: "يرجى اختيار ملف صورة صحيح",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "الملف كبير جداً",
        description: "يرجى اختيار صورة أقل من 5MB",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
    setFormData(prev => ({ ...prev, image: URL.createObjectURL(file) }));
    setImageSource('upload'); // أضفت هذا السطر
    
    toast({
      title: "تم اختيار الصورة",
      description: `تم اختيار: ${file.name}`,
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-restaurant-cream/30">
      <div className="restaurant-gradient text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-arabic text-4xl font-bold mb-2">
            {editProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h1>
          <p className="text-lg opacity-90">
            {editProduct ? 'تعديل بيانات المنتج' : 'أضف منتجاً جديداً إلى القائمة'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {!editProduct && (
            <CategoryManager categories={categories} onCategoriesChange={loadCategories} />
          )}

          <Card className="shadow-xl border-restaurant-gold/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-restaurant-brown font-arabic flex items-center justify-center gap-2">
                <Plus className="w-6 h-6" />
                {editProduct ? 'تعديل المنتج' : 'منتج جديد'}
              </CardTitle>
              <CardDescription className="text-lg">
                يرجى ملء جميع الحقول المطلوبة
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-lg font-semibold text-restaurant-brown">
                    اسم المنتج *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="مثال: شاورما دجاج"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-lg h-12"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-lg font-semibold text-restaurant-brown">
                    الوصف
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="وصف مختصر للمنتج..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="min-h-[100px] text-lg"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-lg font-semibold text-restaurant-brown">
                    السعر (ريال سعودي) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="مثال: 85.50"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="text-lg h-12"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-lg font-semibold text-restaurant-brown">
                    التصنيف *
                  </Label>
                  {isLoadingCategories ? (
                    <div className="text-lg text-gray-500 py-4 text-center">
                      جاري تحميل التصنيفات...
                    </div>
                  ) : (
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                      disabled={isSubmitting || isLoadingCategories}
                    >
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-restaurant-brown">
                    نوع المنتج *
                  </Label>
                  <Select
                    value={formData.type || ''}
                    onValueChange={(value) => handleInputChange('type', value)}
                    required
                  >
                    <SelectTrigger className="h-12 text-lg">
                      <SelectValue placeholder="اختر نوع المنتج" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {/* {PRODUCT_TYPE_ICONS[type]} */}
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-restaurant-brown">
                    صورة المنتج
                  </Label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={imageSource === 'url' ? 'default' : 'outline'}
                      onClick={() => setImageSource('url')}
                      className="flex items-center gap-2"
                    >
                      <Image className="w-4 h-4" />
                      رابط الصورة
                    </Button>
                    <Button
                      type="button"
                      variant={imageSource === 'upload' ? 'default' : 'outline'}
                      onClick={handleUploadClick}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      رفع صورة
                    </Button>
                  </div>

                  {imageSource === 'url' && (
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image}
                      onChange={(e) => handleInputChange('image', e.target.value)}
                      className="text-lg h-12"
                      disabled={isSubmitting}
                    />
                  )}

                  {selectedFile && (
                    <div className="mt-4">
                      <Label className="text-sm font-semibold text-restaurant-brown">
                        معاينة الصورة:
                      </Label>
                      <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={formData.image}
                          alt="معاينة"
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setFormData(prev => ({ ...prev, image: '' }));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 text-lg font-bold restaurant-gradient hover:opacity-90 transition-opacity"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editProduct ? 'جاري التحديث...' : 'جاري الإضافة...'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-5 h-5" />
                      {editProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;