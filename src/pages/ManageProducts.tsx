import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category } from '@/types/restaurant';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import AddProduct from '@/pages/AddProduct';
import { Search, Plus, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BASE_URL } from "@/components/Api/Api";
import axios from "axios";

const ManageProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      throw new Error('Unauthorized');
    }
    return token;
  }, [navigate]);

  const handleApiError = useCallback((error: unknown, toast: any, navigate: any) => {
    let errorMessage = 'حدث خطأ ما';

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        errorMessage = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        errorMessage = error.response?.data?.message || error.message;
      }
    }

    toast({
      title: "خطأ",
      description: errorMessage,
      variant: "destructive"
    });
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = !selectedCategory || String(product.category) === String(selectedCategory);
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = checkAuth();
      
      const response = await axios.get(`${BASE_URL}/api/admin/items`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      const items = (response.data.data || response.data.items || []).map(item => ({
        id: item.id,
        name: item.attributes?.name || "بدون اسم",
        description: item.attributes?.description || "لا يوجد وصف متاح",
        price: parseFloat(item.attributes?.price) || 0,
        image: item.attributes?.image_url || "",
        type: item.attributes?.type || "",
        category: String(item.relationship?.menuCategory?.id) || "غير مصنف",
      }));

      setProducts(items);
      setIsAuthenticated(true);
    } catch (error) {
      handleApiError(error, toast, navigate);
      setError('فشل في جلب المنتجات');
    } finally {
      setLoading(false);
    }
  }, [checkAuth, handleApiError, toast, navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      const token = checkAuth();
      const response = await axios.get(`${BASE_URL}/api/admin/menuCategories`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      let categoriesData = [];
      if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        categoriesData = response.data.items;
      } else if (response.data) {
        categoriesData = [response.data];
      }
      const formattedCategories = categoriesData.map((cat: any) => ({
        id: cat.id || cat._id || Date.now().toString(),
        name: cat.name || cat.title || cat.attributes?.name || cat.attributes?.title || cat.data?.attributes?.name || 'تصنيف جديد',
        description: cat.description || ''
      }));
      setCategories(formattedCategories);
    } catch (error) {
      setCategories([]);
    }
  }, [checkAuth]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProducts();
      fetchCategories();
    }
  }, [fetchProducts, fetchCategories]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${BASE_URL}/api/admin/login`, {
          email,
          password
      }, {
        timeout: 10000
      });
      
      localStorage.setItem('token', response.data.data.token);
      setIsAuthenticated(true);
      await fetchProducts();
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة إدارة المنتجات",
      });
    } catch (error) {
      handleApiError(error, toast, navigate);
      setError('فشل تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
      try {
        const token = checkAuth();
        await axios.delete(`${BASE_URL}/api/admin/items/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchProducts();
        toast({
          title: "تم الحذف",
          description: "تم حذف المنتج بنجاح",
        });
      } catch (error) {
        handleApiError(error, toast, navigate);
      }
  };

  const handleProductSaved = useCallback(() => {
    fetchProducts();
    setEditingProduct(null);
    setShowAddDialog(false);
    // تفعيل الفلتر تلقائيًا على التصنيف الحالي بعد الإضافة
    if (selectedCategory) setSelectedCategory(selectedCategory);
    toast({
      title: "تم التحديث",
      description: "تم تحديث قائمة المنتجات بنجاح",
    });
  }, [fetchProducts, toast, selectedCategory]);

  if (!isAuthenticated && !localStorage.getItem('token')) {
    return (
      <div className="min-h-screen bg-restaurant-cream/30 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <Lock className="w-16 h-16 mx-auto text-restaurant-brown mb-4" />
            <h1 className="text-2xl font-bold text-restaurant-brown mb-2">
              إدارة المنتجات
            </h1>
            <p className="text-gray-600">
              يرجى إدخال كلمة المرور للوصول إلى لوحة الإدارة
            </p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center"
                required
                disabled={loading}
              />
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center"
                required
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full restaurant-gradient text-white"
              disabled={loading}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-restaurant-cream/30">
      {/* Hero Section */}
      <div className="relative h-screen bg-cover bg-center text-white bg-[url('/images/pexels-nano-erdozain-120534369-27643000.jpg')]">
  <div className="absolute inset-0 bg-black bg-opacity-50"></div>

  <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="flex justify-center items-center mb-6">
      <h1 className="font-arabic text-4xl md:text-5xl font-bold">
        إدارة منتجات أبراهيم باشاٍ
      </h1>
    </div>

    <p className="text-lg md:text-xl opacity-90 text-center">
      تحكم في منتجات المطعم - إضافة وتعديل وحذف
    </p>
  </div>
</div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <Button
            onClick={() => setShowAddDialog(true)}
            className="restaurant-gradient text-white hover:opacity-90 transition-opacity"
            size="lg"
          >
            <Plus className="w-5 h-5 ml-2" />
            إضافة منتج جديد
          </Button>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </div>

        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <div className="text-center mb-6">
          <p className="text-lg text-restaurant-brown">
            {filteredProducts.length > 0 
              ? `تم العثور على ${filteredProducts.length} منتج${filteredProducts.length > 1 ? 'ات' : ''}`
              : 'لا توجد منتجات'
            }
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
                showActions={true}
                onEdit={() => setEditingProduct(product)}
                onDelete={() => handleDeleteProduct(Number(product.id))}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-2xl font-bold text-restaurant-brown mb-2">
                لا توجد منتجات
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedCategory || searchTerm
                  ? 'لم نجد أي منتجات تطابق البحث الحالي'
                  : 'لا توجد منتجات متاحة حالياً'}
              </p>
              {!selectedCategory && !searchTerm && (
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="restaurant-gradient text-white"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة أول منتج
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-restaurant-brown">
              إضافة منتج جديد
            </DialogTitle>
            <DialogDescription className="text-center text-lg text-gray-600">
              إضافة منتج جديد للمطعم
            </DialogDescription>
          </DialogHeader>
          <AddProduct onProductSaved={handleProductSaved} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-restaurant-brown">
              تعديل المنتج
            </DialogTitle>
            <DialogDescription className="text-center text-lg text-gray-600">
              تعديل المنتج الحالي
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <AddProduct
              editProduct={editingProduct}
              onProductSaved={handleProductSaved}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageProducts;