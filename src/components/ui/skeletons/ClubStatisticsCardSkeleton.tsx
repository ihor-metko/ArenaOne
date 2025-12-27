/**
 * ClubStatisticsCardSkeleton Component
 * 
 * Loading skeleton for ClubStatisticsCard
 */

import "../ClubStatisticsCard.css";

export function ClubStatisticsCardSkeleton() {
  return (
    <div className="im-club-stat-card">
      <div className="im-club-stat-header">
        <div className="im-skeleton h-5 w-32 rounded" />
      </div>

      <div className="im-club-stat-content">
        {/* Main Value Skeleton */}
        <div className="im-club-stat-main">
          <div className="im-skeleton h-9 w-24 rounded mx-auto mb-2" />
          <div className="im-skeleton h-3 w-32 rounded mx-auto" />
        </div>

        {/* Progress Bar Skeleton */}
        <div className="im-skeleton h-2 w-full rounded-full" />

        {/* Change Indicator Skeleton */}
        <div className="im-club-stat-change">
          <div className="im-skeleton h-7 w-20 rounded-full" />
          <div className="im-skeleton h-3 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}
