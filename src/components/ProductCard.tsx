import { useState } from 'react';
import { Product, Category } from '@/types/restaurant';
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Thermometer, Snowflake, Utensils, Pencil, Trash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

interface ProductCardProps {
  product?: Product;
  categories?: Category[];
  showActions?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  isLoading?: boolean;
}

const ProductCard = ({
  product,
  categories = [],
  showActions = false,
  onEdit,
  onDelete,
  isLoading = false
}: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
        <Skeleton className="aspect-square w-full bg-gray-200" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4 bg-gray-200" />
          <Skeleton className="h-4 w-1/2 bg-gray-200" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-4/5 bg-gray-200" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-6 w-1/4 bg-gray-200" />
            {showActions && (
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded-md bg-gray-200" />
                <Skeleton className="h-9 w-9 rounded-md bg-gray-200" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="border rounded-lg p-6 text-center bg-white">
        <div className="text-red-500 font-medium">⚠️ المنتج غير متوفر</div>
        <p className="text-sm text-gray-500 mt-1">تعذر تحميل بيانات المنتج</p>
      </div>
    );
  }

  const category = categories?.find(cat =>
    String(cat.id) === String(product.category_id ?? product.category))
    || categories?.find(cat => cat.name === product.category);

  return (
    <Card className="shadow-md hover:shadow-lg transition my-3">
      <CardContent className="p-0">
        {product.image &&
          <img
            src={imageError ? '/images/placeholder-food.jpg' : product.image}
            alt={product.name}
            className="w-full object-cover border-t rounded-t-md"
            onError={() => setImageError(true)}
            loading="lazy"
          />}
        <div className="flex justify-between items-center p-2">
          <CardTitle className="font-bold text-lg mb-1 line-clamp-1">{product.name}</CardTitle>
          {product.type && (
            <span className={`${TYPE_COLORS[product.type] || 'bg-gray-100 text-gray-800'}
              text-xs px-2 py-1 rounded-full flex items-center gap-1`}>
              {product.type}
              {PRODUCT_TYPE_ICONS[product.type]}
            </span>
          )}
        </div>
        <div className="flex flex-col mt-2 space-y-2 px-2 pb-2">
          <CardDescription className="text-gray-600 text-sm line-clamp-2 py-1">
            {product.description || 'لا يوجد وصف متاح'}
          </CardDescription>
          <span className="bg-gray-100 p-1 w-fit rounded text-xs text-gray-500 flex items-center">
            {category?.name || "غير مصنف"}
          </span>
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg text-restaurant-brown">
            {Number(product.price).toFixed(2)} ر.س
          </span>
          {showActions && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => onEdit(product)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`هل أنت متأكد من حذف "${product.name}"؟`)) {
                      onDelete(product.id);
                    }
                  }}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;