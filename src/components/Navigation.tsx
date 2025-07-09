import { Link, useLocation } from "react-router-dom";
import { ChefHat, Menu as MenuIcon, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const { toast } = useToast();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/menu');
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
  };
  
  return (
    <nav className="bg-white text-black shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/menu" className="flex items-center space-x-2 space-x-reverse ">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.webp`}
              alt="إبراهيم باشا"
              className="w-100 h-8"
            />
          </Link>
          {/* Navigation Links */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <Link to="/menu">
              <Button
                variant="ghost"
                className={`text-black hover:text-[#ffffff] hover:bg-[#ed7a00] ${
                  isActive("/menu") ? "text-[#ffffff] bg-[#ed7a00]" : ""
                }`}
              >
                <MenuIcon
                  className={`w-4 h-4 ml-2 ${
                    isActive("/menu") ? "text-white" : "text-black"
                  } group-hover:text-[#ed7a00]`}
                />
                المنيو
              </Button>
            </Link>
            {
              !token && (
                <Link to="/manage-products">
                <Button
                  variant="ghost"
                  className={`text-black hover:text-[#ffffff] hover:bg-[#ed7a00] ${
                    isActive("/manage-products")
                      ? "text-[#ffffff] bg-[#ed7a00]"
                      : ""
                  }`}
                >
                  <Settings
                    className={`w-4 h-4 ml-2 ${
                      isActive("/manage-products") ? "text-white" : "text-black"
                    } group-hover:text-[#ed7a00]`}
                  />
                  إدارة المنتجات
                </Button>
                </Link>
              )
            }
            {
              token && (
                <Button
                  variant="ghost"
                  className="text-black hover:text-[#ffffff] hover:bg-[#ed7a00]"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل الخروج
                </Button>
              )
            }
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
