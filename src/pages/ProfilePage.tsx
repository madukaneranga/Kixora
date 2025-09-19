import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Edit3, Save, X, Shield, Package, Heart, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWishlistStore } from '../stores/wishlistStore';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { showSuccessToast, showErrorToast } from '../components/ui/CustomToast';
import logoWhite from '../assests/logo.white.png';
import { InlineLoading } from '../components/ui/Loading';
import Breadcrumb from '../components/ui/Breadcrumb';

const ProfilePage = () => {
  const { user, profile, updatePassword } = useAuth();
  const { items: wishlistItems } = useWishlistStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [stats, setStats] = useState({
    ordersCount: 0,
    wishlistCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setStatsLoading(false);
        return;
      }

      try {
        // Fetch orders count
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStats({
          ordersCount: ordersCount || 0,
          wishlistCount: wishlistItems.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({
          ordersCount: 0,
          wishlistCount: wishlistItems.length,
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user, wishlistItems]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      showSuccessToast('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorToast('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      showErrorToast('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showErrorToast('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showErrorToast('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await updatePassword(passwordData.newPassword);
      if (error) throw error;

      showSuccessToast('Password updated successfully');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      showErrorToast('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordForm(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Please sign in to view your profile.</p>
      </div>
    );
  }

  const breadcrumbItems = [
    {
      label: 'Profile',
      icon: <User size={16} />
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        <Breadcrumb items={breadcrumbItems} variant="white" className="mb-4 sm:mb-6" />
      </div>

      {/* Header with Logo */}
      <div className="flex justify-center pb-4">
        <img
          src={logoWhite}
          alt="Kixora"
          className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto"
        />
      </div>

      <div className="max-w-4xl mx-auto pt-4 sm:pt-8 pb-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10"
        >
          {/* Main Content - Two Column Layout */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

              {/* Left Column - Profile Info */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3 sm:gap-0">
                  <h1 className="text-lg sm:text-xl font-bold text-white">Profile</h1>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-gray-400 hover:text-white hover:bg-white/10 border-white/20"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-white hover:bg-white/10 border-white/20 w-full sm:w-auto"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading}
                        className="!bg-white !text-black hover:!bg-gray-200 font-medium w-full sm:w-auto"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Profile Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-white uppercase tracking-wide">
                      Full Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({ ...formData, full_name: e.target.value })
                        }
                        placeholder="Enter your full name"
                        className="w-full bg-white/5 border-white/20 text-white placeholder:text-gray-400 text-sm"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-white font-medium">
                          {profile?.full_name || 'Not set'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-white uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10 rounded-lg min-w-0">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-white font-medium truncate break-all">
                        {user.email}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Email cannot be changed from this page
                    </p>
                  </div>

                  {/* Member Since */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-white uppercase tracking-wide">
                      Member Since
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white font-medium">
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Password Change */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-white uppercase tracking-wide">
                      Password
                    </label>
                    {!showPasswordForm ? (
                      <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Lock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-white font-medium">••••••••</span>
                        </div>
                        <button
                          onClick={() => setShowPasswordForm(true)}
                          className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                        <Input
                          type="password"
                          placeholder="New password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 text-sm"
                        />
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 text-sm"
                        />
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <Button
                            size="sm"
                            onClick={handlePasswordChange}
                            disabled={passwordLoading}
                            className="!bg-white !text-black hover:!bg-gray-200 !text-xs font-medium w-full sm:w-auto"
                          >
                            {passwordLoading ? 'Updating...' : 'Update'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelPasswordChange}
                            className="text-gray-400 hover:text-white hover:bg-white/10 border-white/20 !text-xs w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Profile Avatar & Stats */}
              <div className="lg:col-span-1 order-first lg:order-last">
                <div className="space-y-4 sm:space-y-6">
                  {/* Profile Avatar */}
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                      {(isEditing ? formData.full_name : profile?.full_name) ? (
                        <span className="text-lg sm:text-xl font-bold">
                          {getInitials(isEditing ? formData.full_name : profile?.full_name || '')}
                        </span>
                      ) : (
                        <User className="w-8 h-8 sm:w-10 sm:h-10" />
                      )}
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-white mb-2 break-words">
                      {isEditing ? (formData.full_name || 'User') : (profile?.full_name || 'User')}
                    </h2>
                    {profile?.role === 'admin' && (
                      <div className="inline-flex items-center px-2 py-1 bg-white text-black rounded-full text-xs font-medium">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white text-center">
                      Quick Stats
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <Link to="/orders">
                        <motion.div
                          className="flex items-center justify-between p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group min-h-[48px]"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center min-w-0">
                            <Package className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors mr-2 flex-shrink-0" />
                            <span className="text-sm font-medium text-white truncate">Orders</span>
                          </div>
                          <div className="text-lg font-bold text-white flex-shrink-0 ml-2">
                            {statsLoading ? <InlineLoading size="sm" /> : stats.ordersCount}
                          </div>
                        </motion.div>
                      </Link>

                      <Link to="/wishlist">
                        <motion.div
                          className="flex items-center justify-between p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group min-h-[48px]"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center min-w-0">
                            <Heart className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors mr-2 flex-shrink-0" />
                            <span className="text-sm font-medium text-white truncate">Wishlist</span>
                          </div>
                          <div className="text-lg font-bold text-white flex-shrink-0 ml-2">
                            {statsLoading ? <InlineLoading size="sm" /> : stats.wishlistCount}
                          </div>
                        </motion.div>
                      </Link>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      Click to view details
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;