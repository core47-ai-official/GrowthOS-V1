import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { safeMaybeSingle } from '@/lib/database-safety';
import { logger } from '@/lib/logger';

interface RecordingUnlock {
  recording_id: string;
  sequence_order: number;
  is_unlocked: boolean;
  unlock_reason: string;
}

export const useRecordingUnlocks = () => {
  const { user } = useAuth();
  const [unlocks, setUnlocks] = useState<RecordingUnlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUnlocks();
    }
  }, [user?.id]);

  // Listen for submission approvals to refresh unlock status
  useEffect(() => {
    if (!user?.id) return;

    // Listen for PostgreSQL notifications
    const channel = supabase.channel('submission_notifications');
    
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'submissions',
      filter: `student_id=eq.${user.id}`
    }, (payload) => {
      logger.debug('Received submission change, refreshing unlocks', payload);
      fetchUnlocks();
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchUnlocks = async () => {
    if (!user?.id) return;

    try {
      logger.debug('Fetching unlock status for user:', { userId: user.id });
      
      // Always use sequential unlock logic (hardcoded behavior)
      const { data, error } = await supabase.rpc('get_sequential_unlock_status', {
        p_user_id: user.id
      });

      if (error) {
        logger.error('Error fetching sequential unlock status:', error);
        throw error;
      }

      // Transform to match existing interface
      const transformedData = (data || []).map(item => ({
        recording_id: item.recording_id,
        sequence_order: item.sequence_order,
        is_unlocked: item.is_unlocked,
        unlock_reason: item.unlock_reason
      }));

      logger.debug('Sequential unlock data:', { data: transformedData });
      setUnlocks(transformedData);
    } catch (error) {
      logger.error('Error fetching recording unlocks:', error);
      // No fallback - maintain strict sequential behavior
      setUnlocks([]);
    } finally {
      setLoading(false);
    }
  };

  const isRecordingUnlocked = (recordingId: string) => {
    const unlock = unlocks.find(unlock => unlock.recording_id === recordingId);
    return unlock?.is_unlocked || false;
  };

  const refreshUnlocks = () => {
    setLoading(true);
    fetchUnlocks();
  };

  return {
    unlocks,
    loading,
    isRecordingUnlocked,
    refreshUnlocks
  };
};