import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NavigationPage } from '@/types/ui';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'error';
  message: string;
  duration?: number;
}

interface UIState {
  activePage: NavigationPage;
  isModalOpen: boolean;
  modalType: string | null;
  loading: boolean;
  notifications: Notification[];
  showWinModal: boolean;
  isOffline: boolean;
}

interface UIActions {
  setActivePage: (activePage: NavigationPage) => void;
  openModal: (modalType: string) => void;
  closeModal: () => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setShowWinModal: (show: boolean) => void;
  setOffline: (offline: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      activePage: 'main',
      isModalOpen: false,
      modalType: null,
      loading: false,
      notifications: [],
      showWinModal: true,
      isOffline: false,

      setActivePage: (activePage) => set({ activePage }),

      openModal: (modalType) =>
        set({ isModalOpen: true, modalType }),

      closeModal: () =>
        set({ isModalOpen: false, modalType: null }),

      setLoading: (loading) => set({ loading }),

      addNotification: (notification) => {
        const id = Date.now().toString();
        const newNotification: Notification = { ...notification, id };
        
        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }));

        // Автоматически удаляем уведомление через указанное время
        const duration = notification.duration || 5000;
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }));
        }, duration);
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        })),

      clearNotifications: () => set({ notifications: [] }),

      setShowWinModal: (show) => set({ showWinModal: show }),
      setOffline: (offline) => set({ isOffline: offline }),
    }),
    {
      name: 'ui-storage', // unique name
      partialize: (state) => ({ showWinModal: state.showWinModal }), // only persist the showWinModal field
    }
  )
); 