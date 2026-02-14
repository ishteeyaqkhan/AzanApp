import { useState, useEffect } from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent, getVoices } from '../services/api';
import EventForm from '../components/EventForm';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [voices, setVoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [eventsData, voicesData] = await Promise.all([
        getEvents(),
        getVoices(true),
      ]);
      setEvents(eventsData);
      setVoices(voicesData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setError('');

      if (editingEvent) {
        await updateEvent(editingEvent.id, data);
        setSuccess('Event updated successfully');
      } else {
        await createEvent(data);
        setSuccess('Event added successfully');
      }

      handleCloseModal();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      await deleteEvent(id);
      setSuccess('Event deleted successfully');
      setDeleteConfirm(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete event');
      setDeleteConfirm(null);
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

  const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getScheduleLabel = (event) => {
    if (event.scheduleMode === 'daily') return 'Daily';
    if (event.scheduleMode === 'weekly') {
      const days = (event.weekdays || []).map(d => WEEKDAY_SHORT[d]).join(', ');
      return days ? `Weekly (${days})` : 'Weekly';
    }
    if (event.startDate && event.endDate) {
      const start = new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${start} - ${end}`;
    }
    return 'Date Range';
  };

  const getTimeLabel = (event) => {
    if (event.timeMode === 'fixed') return formatTime(event.fixedTime);
    const count = event.schedules ? event.schedules.length : 0;
    return count > 0 ? `Custom (${count} days)` : 'Custom';
  };

  const getSkipDaysLabel = (event) => {
    const days = event.inactiveDays || [];
    if (days.length === 0) return '-';
    return days.map(d => WEEKDAY_SHORT[d]).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-gray-400 mt-1">Manage scheduled events and timings</p>
        </div>
        <button
          onClick={handleAddEvent}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Event
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">No events found</h3>
            <p className="text-gray-400 text-sm">Add your first event to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750 border-b border-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Voice</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Schedule</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Time</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Skip Days</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4">
                      <span className="font-medium text-white">{event.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-700 rounded text-gray-300 text-sm">
                        {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {event.voice ? event.voice.name : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {getScheduleLabel(event)}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {getTimeLabel(event)}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {getSkipDaysLabel(event)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.isActive
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {event.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(event)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h2>
            </div>
            <div className="p-6">
              <EventForm
                event={editingEvent}
                voices={voices}
                onSubmit={handleSubmit}
                onCancel={handleCloseModal}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-sm border border-gray-700 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Delete Event</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <strong className="text-white">{deleteConfirm.name}</strong>? This will also delete all associated schedules.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
