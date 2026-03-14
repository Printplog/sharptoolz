import { Outlet } from 'react-router-dom';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import ScrollToTop from '@/components/ScrollToTop';

export default function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <AnalyticsTracker />
      <Outlet />
    </>
  );
}
