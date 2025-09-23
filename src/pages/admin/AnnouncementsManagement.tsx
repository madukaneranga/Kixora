import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { showSuccessToast, showErrorToast } from '../../components/ui/CustomToast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

interface Announcement {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  priority: number;
  start_date: string;
  end_date: string | null;
  background_color: string;
  text_color: string;
  link_url: string | null;
  created_at: string;
  updated_at: string;
}

const announcementSchema = yup.object({
  title: yup.string().required('Title is required'),
  message: yup.string().required('Message is required'),
  priority: yup.number().min(0, 'Priority must be 0 or higher').required('Priority is required'),
  start_date: yup.string().required('Start date is required'),
  end_date: yup.string().nullable(),
  background_color: yup.string().required('Background color is required'),
  text_color: yup.string().required('Text color is required'),
  link_url: yup.string().url('Must be a valid URL').nullable(),
  is_active: yup.boolean(),
});

const AnnouncementsManagement = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(announcementSchema),
    defaultValues: {
      title: '',
      message: '',
      priority: 0,
      start_date: new Date().toISOString().slice(0, 16),
      end_date: '',
      background_color: '#000000',
      text_color: '#ffffff',
      link_url: '',
      is_active: true,
    },
  });

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      showErrorToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = () => {
    setEditingAnnouncement(null);
    reset({
      title: '',
      message: '',
      priority: 0,
      start_date: new Date().toISOString().slice(0, 16),
      end_date: '',
      background_color: '#000000',
      text_color: '#ffffff',
      link_url: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    reset({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      start_date: new Date(announcement.start_date).toISOString().slice(0, 16),
      end_date: announcement.end_date ? new Date(announcement.end_date).toISOString().slice(0, 16) : '',
      background_color: announcement.background_color,
      text_color: announcement.text_color,
      link_url: announcement.link_url || '',
      is_active: announcement.is_active,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const announcementData = {
        title: data.title,
        message: data.message,
        priority: parseInt(data.priority),
        start_date: data.start_date,
        end_date: data.end_date || null,
        background_color: data.background_color,
        text_color: data.text_color,
        link_url: data.link_url || null,
        is_active: data.is_active,
      };

      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        showSuccessToast('Announcement updated successfully');
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert(announcementData);

        if (error) throw error;
        showSuccessToast('Announcement created successfully');
      }

      setShowModal(false);
      fetchAnnouncements();
    } catch (error: any) {
      showErrorToast(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      showSuccessToast(`Announcement ${!currentActive ? 'activated' : 'deactivated'}`);
      fetchAnnouncements();
    } catch (error: any) {
      showErrorToast(error.message);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccessToast('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error: any) {
      showErrorToast(error.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const breadcrumbItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard'
    },
    {
      label: 'Announcements'
    }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} variant="white" />

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Announcements</h1>
            <p className="text-gray-400">Manage announcement bar messages</p>
          </div>
          <Button onClick={handleCreate} className="bg-white text-black hover:bg-gray-200">
            <Plus className="w-4 h-4 mr-2" />
            Create Announcement
          </Button>
        </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {announcements.map((announcement) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[rgb(20,20,20)] border border-[rgb(51,51,51)] rounded-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        announcement.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                      Priority: {announcement.priority}
                    </span>
                  </div>

                  <div
                    className="p-3 rounded-md mb-3 text-sm"
                    style={{
                      backgroundColor: announcement.background_color,
                      color: announcement.text_color
                    }}
                  >
                    {announcement.message}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Start: {formatDate(announcement.start_date)}</span>
                    </div>
                    {announcement.end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>End: {formatDate(announcement.end_date)}</span>
                      </div>
                    )}
                    {announcement.link_url && (
                      <div className="flex items-center gap-1">
                        <LinkIcon className="w-4 h-4" />
                        <span>Has Link</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    onClick={() => toggleActive(announcement.id, announcement.is_active)}
                    variant="outline"
                    size="sm"
                    className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                  >
                    {announcement.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={() => handleEdit(announcement)}
                    variant="outline"
                    size="sm"
                    className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteAnnouncement(announcement.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {announcements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No announcements yet. Create your first announcement!</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <Input
                {...register('title')}
                error={errors.title?.message}
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <Input
                type="number"
                {...register('priority')}
                error={errors.priority?.message}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              {...register('message')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Announcement message"
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Background Color
              </label>
              <input
                type="color"
                {...register('background_color')}
                className="w-full h-10 rounded-md border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Text Color
              </label>
              <input
                type="color"
                {...register('text_color')}
                className="w-full h-10 rounded-md border border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <Input
                type="datetime-local"
                {...register('start_date')}
                error={errors.start_date?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date (Optional)
              </label>
              <Input
                type="datetime-local"
                {...register('end_date')}
                error={errors.end_date?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Link URL (Optional)
            </label>
            <Input
              {...register('link_url')}
              error={errors.link_url?.message}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('is_active')}
              className="mr-2"
            />
            <label className="text-sm text-gray-300">
              Active
            </label>
          </div>

          <div
            className="p-3 rounded-md text-sm"
            style={{
              backgroundColor: watch('background_color'),
              color: watch('text_color')
            }}
          >
            Preview: {watch('message') || 'Your message will appear here...'}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="bg-white text-black hover:bg-gray-200"
            >
              {editingAnnouncement ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </AdminLayout>
  );
};

export default AnnouncementsManagement;