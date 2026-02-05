import { useState, useEffect, useRef } from 'react';
import { getPrayers, createPrayer, updatePrayer, deletePrayer, SERVER_URL } from '../services/api';
import PrayerForm from '../components/PrayerForm';

export default function Prayers() {
  const [prayers, setPrayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchPrayers();
  }, [dateFilter]);

  const fetchPrayers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getPrayers(dateFilter || undefined);
      setPrayers(data);
    } catch (err) {
      setError('Failed to load prayers');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrayer = () => {
    setEditingPrayer(null);
    setShowModal(true);
  };

  const handleEditPrayer = (prayer) => {
    setEditingPrayer(prayer);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPrayer(null);
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setError('');

      if (editingPrayer) {
        await updatePrayer(editingPrayer._id, formData);
        setSuccess('Prayer updated successfully');
      } else {
        await createPrayer(formData);
        setSuccess('Prayer added successfully');
      }

      handleCloseModal();
      fetchPrayers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save prayer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      await deletePrayer(id);
      setSuccess('Prayer deleted successfully');
      setDeleteConfirm(null);
      fetchPrayers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete prayer');
    }
  };

  const handlePlayAudio = (prayer) => {
    if (playingAudio === prayer.id) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(`${SERVER_URL}/${prayer.soundFile}`);
      audio.onended = () => setPlayingAudio(null);
      audio.play();
      audioRef.current = audio;
      setPlayingAudio(prayer.id);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Prayers</h1>
          <p className="text-gray-400 mt-1">Manage prayer times and audio files</p>
        </div>
        <button
          onClick={handleAddPrayer}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Prayer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <label className="text-gray-300 text-sm font-medium">Filter by Date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filter
            </button>
          )}
        </div>
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
        ) : prayers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">No prayers found</h3>
            <p className="text-gray-400 text-sm">
              {dateFilter ? 'No prayers scheduled for this date' : 'Add your first prayer to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750 border-b border-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Time</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Audio</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {prayers.map((prayer) => (
                  <tr key={prayer.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4">
                      <span className="font-medium text-white">{prayer.name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{formatTime(prayer.time)}</td>
                    <td className="px-6 py-4 text-gray-300">{formatDate(prayer.date)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          prayer.isActive
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {prayer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {prayer.soundFile && (
                        <button
                          onClick={() => handlePlayAudio(prayer)}
                          className={`p-2 rounded-lg transition-colors ${
                            playingAudio === prayer.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {playingAudio === prayer.id ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditPrayer(prayer)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(prayer)}
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
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {editingPrayer ? 'Edit Prayer' : 'Add New Prayer'}
              </h2>
            </div>
            <div className="p-6">
              <PrayerForm
                prayer={editingPrayer}
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
              <h3 className="text-lg font-semibold text-white mb-2">Delete Prayer</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <strong className="text-white">{deleteConfirm.name}</strong> prayer? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm._id)}
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
