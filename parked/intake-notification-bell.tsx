'use client';

import { useEffect, useState } from 'react';
import { checkNewIntakesAction } from '@/app/(staff)/actions/poll-intakes';
import { useRouter } from 'next/navigation';

export function IntakeNotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLastChecked(new Date());

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!lastChecked) return;

    const interval = setInterval(async () => {
      try {
        const newIntakes = await checkNewIntakesAction(lastChecked);
        if (newIntakes && newIntakes.length > 0) {
          // Play a sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Audio play blocked', e));

          setUnreadCount(prev => prev + newIntakes.length);
          setLastChecked(new Date());

          // Trigger Browser Push (Level 2)
          if ('Notification' in window && Notification.permission === 'granted') {
            newIntakes.forEach(intake => {
              new Notification('New Order Intake Received', {
                body: `Customer: ${intake.customerName}`,
                icon: '/logo.png' // assuming logo exists
              });
            });
          }

          // Force a router refresh so the dashboard counter updates
          router.refresh();
        }
      } catch (err) {
        // Ignore poll failures
      }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [lastChecked, router]);

  if (unreadCount === 0) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 cursor-pointer animate-bounce z-50"
      onClick={() => {
        setUnreadCount(0);
        router.push('/pilot/order-desk');
        router.refresh();
      }}
    >
      <span className="text-xl">🔔</span>
      <div className="flex flex-col">
        <span className="font-bold text-sm">{unreadCount} New Form{unreadCount > 1 ? 's' : ''} Received!</span>
        <span className="text-[10px] text-white/80">Click to view</span>
      </div>
    </div>
  );
}
