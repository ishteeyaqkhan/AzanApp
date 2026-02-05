import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStats, getTodayEvents } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalVoices: 0, activeVoices: 0, totalEvents: 0, activeEvents: 0 });
  const [todayEvents, setTodayEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsData, eventsData] = await Promise.all([
        getStats(),
        getTodayEvents(),
      ]);
      setStats(statsData);
      setTodayEvents(eventsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Voices</p>
              <p className="text-2xl font-bold text-white">{stats.totalVoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Voices</p>
              <p className="text-2xl font-bold text-white">{stats.activeVoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Events</p>
              <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Events</p>
              <p className="text-2xl font-bold text-white">{stats.activeEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Today's Events */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Today's Events</h2>
          <Link
            to="/events"
            className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
          >
            Manage Events
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {todayEvents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">No events scheduled for today</h3>
            <p className="text-gray-400 text-sm mb-4">Add events to get started</p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 flex items-center justify-between hover:bg-gray-750"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{event.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {event.type} {event.voiceName ? `- ${event.voiceName}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-emerald-400 font-medium">{formatTime(event.time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
