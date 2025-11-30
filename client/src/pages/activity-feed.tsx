import React from 'react';
import ActivityFeed from '../components/activity-feed/ActivityFeed';
import { Card, CardContent } from '../components/ui/card';

export default function ActivityFeedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaeaea] to-[#f5f5f5] dark:from-[#26282b] dark:to-[#383b3e] pt-4 md:pt-6">
      <div className="container mx-auto px-4 md:px-6 pb-4 md:pb-6 space-y-6">
        <div className="activity-feed-header">
          <h1 className="text-3xl font-bold text-[#26282b] dark:text-[#eaeaea]">Activity Feed</h1>
          <p className="text-[#26282b]/70 dark:text-[#eaeaea]/70 mt-2">
            Track activities and view recent updates
          </p>
        </div>

        <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
          <CardContent className="p-0">
            <ActivityFeed />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
