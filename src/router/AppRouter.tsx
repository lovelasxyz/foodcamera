import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { HomePage } from '@/pages/HomePage';
import { ProfilePage } from '@/pages/ProfilePage';

const InventoryPage: React.FC = () => <div className="page-container"><h2>Inventory</h2><p>Coming soon...</p></div>;
const WeeklyPage: React.FC = () => <div className="page-container"><h2>Weekly</h2><p>Coming soon...</p></div>;
const JackpotPage: React.FC = () => <div className="page-container"><h2>Jackpot</h2><p>Coming soon...</p></div>;
const UpgradePage: React.FC = () => <div className="page-container"><h2>Upgrade</h2><p>Coming soon...</p></div>;

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<HomePage />} />
      <Route path={ROUTES.profile} element={<ProfilePage />} />
      <Route path={ROUTES.inventory} element={<InventoryPage />} />
      <Route path={ROUTES.weekly} element={<WeeklyPage />} />
      <Route path={ROUTES.jackpot} element={<JackpotPage />} />
      <Route path={ROUTES.upgrade} element={<UpgradePage />} />
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
};

export default AppRouter;
