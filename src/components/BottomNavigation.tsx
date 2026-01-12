import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { BookOpen, Plus, User, Paintbrush, Palette, Sparkles, Menu, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  hasSubmenu?: boolean;
}

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useSubscription();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      id: "books",
      label: "Kitaplarım",
      icon: <BookOpen className="w-5 h-5" />,
      path: "/home",
    },
    {
      id: "create",
      label: "Hikaye Oluştur",
      icon: <Plus className="w-5 h-5" />,
      hasSubmenu: true,
    },
    {
      id: "profile",
      label: "Profil",
      icon: <User className="w-5 h-5" />,
      path: "/profile",
    },
  ];

  const createOptions = [
    {
      id: "drawing",
      label: "Çizimden",
      description: "Çocuğunuzun çiziminden hikaye oluşturun",
      icon: <Paintbrush className="w-6 h-6" />,
      path: "/create/drawing",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "theme",
      label: "Temadan",
      description: "Hazır temalardan birini seçin",
      icon: <Palette className="w-6 h-6" />,
      path: "/create/theme",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "custom",
      label: "Kendi Teman",
      description: "Kendi temanızı yazarak hikaye oluşturun",
      icon: <Sparkles className="w-6 h-6" />,
      path: "/create/custom",
      gradient: "from-orange-500 to-yellow-500",
    },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.hasSubmenu) {
      setIsCreateOpen(true);
      setIsMenuOpen(false);
    } else if (item.path) {
      navigate(item.path);
      setIsMenuOpen(false);
    }
  };

  const handleCreateOption = (path: string) => {
    setIsCreateOpen(false);
    setIsMenuOpen(false);
    navigate(path);
  };

  const isActive = (item: NavItem) => {
    if (item.path === "/home") {
      return location.pathname === "/home";
    }
    return item.path ? location.pathname.startsWith(item.path) : false;
  };

  const isCreateActive = location.pathname.startsWith("/create");

  return (
    <>
      {/* Desktop/Tablet Header Navigation */}
      <nav className="hidden lg:flex fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border h-16">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 font-bold text-xl text-primary"
          >
            📚 Hikaye Kitaplığım
          </button>

          {/* Nav Items */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={(item.id === "create" ? isCreateActive : isActive(item)) ? "default" : "ghost"}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "gap-2",
                  item.id === "create" && "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Button>
            ))}
            {isAdmin && (
              <Button
                asChild
                variant={location.pathname === "/admin" ? "default" : "ghost"}
                className="gap-2"
              >
                <Link to="/admin">
                  <Shield className="w-5 h-5" />
                  <span>Admin</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Desktop spacer */}
      <div className="hidden lg:block h-16" />

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 rounded-lg transition-all",
                (item.id === "create" ? isCreateActive : isActive(item))
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-full transition-all",
                  (item.id === "create" ? isCreateActive : isActive(item))
                    ? "bg-primary/10"
                    : ""
                )}
              >
                {item.icon}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 rounded-lg transition-all",
                location.pathname === "/admin"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-full transition-all",
                  location.pathname === "/admin" ? "bg-primary/10" : ""
                )}
              >
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">Admin</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Create Options Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-center text-xl">Hikaye Oluştur</SheetTitle>
          </SheetHeader>
          <div className="grid gap-3 pb-6">
            {createOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleCreateOption(option.path)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border border-border",
                  "bg-gradient-to-r hover:scale-[1.02] transition-all",
                  option.gradient,
                  "text-white"
                )}
              >
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  {option.icon}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">{option.label}</h3>
                  <p className="text-sm opacity-90">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default BottomNavigation;
