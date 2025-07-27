import { useEffect, useRef } from 'react';
import { useBadges } from '@/contexts/BadgesContext';
import { usePoints } from '@/contexts/PointsContext';
import { toast } from '@/hooks/use-toast';

const getInitialRewarded = () => {
  try {
    const stored = localStorage.getItem('badge_rewarded');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const BadgeRewardWatcher = () => {
  const { badges } = useBadges();
  const { addPoints } = usePoints();
  // Track which badges have already been rewarded, persisted in localStorage
  const rewardedRef = useRef<{ [name: string]: boolean }>(getInitialRewarded());

  useEffect(() => {
    let updated = false;
    badges.forEach(badge => {
      if (badge.earned && !rewardedRef.current[badge.name]) {
        addPoints(100, `Unlocked badge: ${badge.name}`);
        toast({
          title: 'Badge Unlocked!',
          description: `${badge.icon} ${badge.name} — You earned 100 points!`,
        });
        rewardedRef.current[badge.name] = true;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem('badge_rewarded', JSON.stringify(rewardedRef.current));
    }
  }, [badges, addPoints]);

  return null;
};

export default BadgeRewardWatcher; 