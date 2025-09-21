import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderOpen,
  Users,
  ClipboardList,
  LogOut,
  Home,
  Grid3X3,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import logo from '../../assests/logo.black.png';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  const handleBackHome = async () => {
    navigate('/');
  };

  const sidebarItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/categories', label: 'Categories', icon: FolderOpen },
    { path: '/admin/collections', label: 'Collections', icon: Grid3X3 },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/contact-messages', label: 'Contact Messages', icon: MessageCircle },
    { path: '/admin/support-requests', label: 'Support Requests', icon: HelpCircle },
    { path: '/admin/audit', label: 'Audit Logs', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <div className="w-64 bg-black border-r border-[rgb(51,51,51)] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[rgb(51,51,51)]">
          <img src={logo} alt="Logo" className="h-8" />
          <p className="text-[rgb(94,94,94)] text-sm mt-2">Admin Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-[rgb(51,51,51)]">
          <Button
            onClick={handleBackHome}
            variant="outline"
            className="w-full border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;