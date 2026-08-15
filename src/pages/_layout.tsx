import { Outlet } from 'react-router-dom';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';

export default function RootLayout() {
  const isHostedEmbed = window.location.pathname === '/embed'

  return (
    <>
      {!isHostedEmbed && <AnalyticsTracker />}
      <Outlet />
    </>
  );
}
