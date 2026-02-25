import React, { useState, useEffect } from 'react';

const LiveStats = ({ socket }) => {
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalMatches: 0,
    messagesSent: 0,
    avgResponseTime: '0.0s'
  });

  // Real-time updates from socket
  useEffect(() => {
    if (!socket) return;

    console.log("📊 LiveStats: Setting up socket listeners");

    // Request initial stats
    socket.emit("request_stats");

    // Handle real-time stats updates
    const handleStatsUpdate = (data) => {
      console.log("📊 Stats update received:", data);
      setStats(prev => ({
        ...prev,
        ...data
      }));
    };

    // Handle individual stat updates
    const handleActiveUsers = (count) => {
      setStats(prev => ({ ...prev, activeUsers: count }));
    };

    const handleTotalMatches = (count) => {
      setStats(prev => ({ ...prev, totalMatches: count }));
    };

    const handleMessagesSent = (count) => {
      setStats(prev => ({ ...prev, messagesSent: count }));
    };

    // Register listeners
    socket.on("stats_update", handleStatsUpdate);
    socket.on("active_users", handleActiveUsers);
    socket.on("total_matches", handleTotalMatches);
    socket.on("messages_sent", handleMessagesSent);

    // Cleanup
    return () => {
      socket.off("stats_update", handleStatsUpdate);
      socket.off("active_users", handleActiveUsers);
      socket.off("total_matches", handleTotalMatches);
      socket.off("messages_sent", handleMessagesSent);
    };
  }, [socket]);

  const statItems = [
    {
      label: 'Active Now',
      value: stats.activeUsers,
      icon: '👥',
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Total Matches',
      value: stats.totalMatches.toLocaleString(),
      icon: '💕',
      color: 'text-pink-500',
      bg: 'bg-pink-50 dark:bg-pink-900/20'
    },
    {
      label: 'Messages',
      value: stats.messagesSent.toLocaleString(),
      icon: '💬',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Avg. Response',
      value: stats.avgResponseTime,
      icon: '⚡',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
  ];

  return (
    <div className="py-8">
      <h3 className="text-xl font-semibold text-center mb-8 text-gray-900 dark:text-white">
        Live Community Stats
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={`${item.bg} rounded-xl p-4 text-center relative overflow-hidden
                     border border-gray-200 dark:border-gray-800
                     shadow-sm dark:shadow-none`}
          >
            {/* Icon */}
            <div className={`text-2xl mb-2 ${item.color}`}>
              {item.icon}
            </div>

            {/* Value */}
            <div className={`text-xl font-bold ${item.color} mb-1`}>
              {item.value}
            </div>

            {/* Label */}
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {item.label}
            </div>

            {/* Live indicator for active users */}
            {item.label === 'Active Now' && (
              <div className="absolute top-2 right-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Last updated timestamp */}
      <div className="text-center mt-4 text-xs text-gray-500 dark:text-gray-500">
        Live • Updated in real-time
      </div>
    </div>
  );
};

export default LiveStats;