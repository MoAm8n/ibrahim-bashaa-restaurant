
import { Link } from "react-router-dom";
import { ChefHat, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-restaurant-cream/30">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-8xl mb-6">🍽️</div>
        
        <h1 className="text-6xl font-bold text-restaurant-gold mb-4 font-arabic">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-restaurant-brown mb-4 font-arabic">
          الصفحة غير موجودة
        </h2>
        
        <p className="text-lg text-gray-600 mb-8">
          عذراً، الصفحة التي تبحث عنها غير متاحة أو تم نقلها إلى مكان آخر
        </p>
        
        <Link to="/">
          <Button className="restaurant-gradient text-white px-8 py-3 text-lg font-semibold hover:opacity-90 transition-opacity">
            <Home className="w-5 h-5 ml-2" />
            العودة إلى المنيو
          </Button>
        </Link>
        
        <div className="mt-8 flex justify-center">
          <ChefHat className="w-12 h-12 text-restaurant-gold/50" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
