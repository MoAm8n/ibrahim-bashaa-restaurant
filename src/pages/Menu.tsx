import React, { useEffect, useState } from "react";
import { getCategories, getItems } from "@/services/productService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Thermometer, Snowflake, Utensils, Search, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const Menu = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const TYPE_COLORS: Record<string, string> = {
    'ساخن': 'bg-red-100 text-red-800',
    'بارد': 'bg-blue-100 text-blue-800',
    'أكل': 'bg-green-100 text-green-800',
  };
  
  const PRODUCT_TYPE_ICONS: Record<string, JSX.Element> = {
    'ساخن': <Thermometer className="w-4 h-4" />,
    'بارد': <Snowflake className="w-4 h-4" />,
    'أكل': <Utensils className="w-4 h-4" />,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, itemsRes] = await Promise.all([
          getCategories(),
          getItems()
        ]);
        const categories = (catRes.data.data || catRes.data.items || []).map(cat => ({
          id: String(cat.id),
          name: cat.attributes?.name || "بدون اسم",
          description: cat.attributes?.description || "",
        }));
        const items = (itemsRes.data.data || itemsRes.data.items || []).map(item => ({
          id: item.id,
          name: item.attributes?.name || "بدون اسم",
          description: item.attributes?.description || "",
          price: item.attributes?.price || 0,
          image: item.attributes?.image_url || "",
          type: item.attributes?.type || "",
          category: String(item.relationship?.menuCategory?.id) || "غير مصنف",
          is_available: item.attributes?.is_available || false,
        }));
        setCategories(categories);
        setItems(items);
      } catch (err) {
        toast({
          title: "خطأ في جلب البيانات",
          description: "يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // تصفية المنتجات حسب التصنيف والبحث
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        <span className="ml-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[url('/images/pexels-nano-erdozain-120534369-27643000.jpg')] bg-cover bg-center text-white h-screen flex justify-center items-center">
        <div className="container mx-auto px-4 text-center h-screen  bg-[rgba(0,0,0,.3)] flex justify-center items-center ">
          <div>
            <h1 className="font-arabic text-5xl font-bold mb-4">
              منيو مطعم أبراهيم باشا
            </h1>
            <p className="text-xl opacity-90">
              اكتشف مجموعتنا المتنوعة من الأطباق الشهية والمشروبات المنعشة
            </p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-restaurant-brown">قائمة الطعام</h1>
        {/* شريط البحث */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </div>
        <div className="mb-8"></div>
        <div className="flex flex-wrap gap-3 justify-center items-center">
          <Button
            onClick={() => setSelectedCategory("all")}
            variant={selectedCategory === "all" ? 'default' : 'outline'}
          >
            عرض الكل
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
            >
              {cat.name}
            </Button>
          ))}
        </div>
        <div className="text-center mt-2 text-sm text-gray-500">
          عدد التصنيفات المتاحة: {categories.length}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">لا توجد منتجات مطابقة</div>
          ) : (
            filteredItems.map(item => {
              const category = categories.find(cat => cat.id === item.category);
              return (
                <Card key={item.id} className="shadow-md hover:shadow-lg transition my-3 flex flex-col">
                  <CardContent className="p-0 flex-1 flex flex-col">
                    {item.image && (
                      <img
                        src={item.image || '/images/placeholder-food.jpg'}
                        alt={item.name}
                        className="w-full object-cover border-t rounded-t-md"
                        onError={e => { e.currentTarget.src = '/images/placeholder-food.jpg'; }}
                        loading="lazy"
                      />
                    )}
                    <div className="flex justify-between items-center p-2">
                      <CardTitle className="font-bold text-lg line-clamp-1">{item.name}</CardTitle>
                      {item.type && (
                        <span className={`${TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-800'}
                          text-xs px-2 py-1 rounded-full flex items-center gap-1`}>
                          {item.type}
                          {PRODUCT_TYPE_ICONS[item.type]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between p-2">
                      <CardDescription className="text-gray-600 text-sm line-clamp-2 m-0 mb-2">
                        {item.description || 'لا يوجد وصف متاح'}
                      </CardDescription>
                      <span className="bg-gray-100 p-1 w-fit rounded text-xs text-gray-500 flex items-center">
                        {category?.name || "غير مصنف"}
                      </span>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-lg text-restaurant-brown">
                          {Number(item.price).toFixed(2)} ر.س
                        </span>
                      {item.is_available && (
                        <span className="bg-green-100 p-1 w-fit rounded text-xs text-green-500 flex items-center">
                          متاح
                        </span>
                      )}
                      {!item.is_available && (
                        <span className="bg-red-100 p-1 w-fit rounded text-xs text-red-500 flex items-center">
                          غير متاح
                        </span>
                      )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
      