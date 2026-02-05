import { useState, useEffect, useMemo } from 'react';

export default function EventForm({ event, voices, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    voiceId: '',
    scheduleMode: 'daily',
    startDate: '',
    endDate: '',
    timeMode: 'fixed',
    fixedTime: '',
    isActive: true,
  });
  const [customSchedules, setCustomSchedules] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        type: event.type || '',
        voiceId: event.voiceId || '',
        scheduleMode: event.scheduleMode || 'daily',
        startDate: event.startDate || '',
        endDate: event.endDate || '',
        timeMode: event.timeMode || 'fixed',
        fixedTime: event.fixedTime || '',
        isActive: event.isActive !== undefined ? event.isActive : true,
      });
      if (event.schedules && event.schedules.length > 0) {
        setCustomSchedules(event.schedules.map(s => ({ date: s.date, time: s.time })));
      }
    }
  }, [event]);

  // Generate date list for custom time mode
  const dateList = useMemo(() => {
    if (formData.scheduleMode !== 'date_range' || !formData.startDate || !formData.endDate) return [];
    const dates = [];
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (start > end) return [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [formData.scheduleMode, formData.startDate, formData.endDate]);

  // Auto-generate custom schedules when dates change
  useEffect(() => {
    if (formData.timeMode === 'custom' && dateList.length > 0) {
      setCustomSchedules(prev => {
        const existingMap = {};
        prev.forEach(s => { existingMap[s.date] = s.time; });
        return dateList.map(date => ({
          date,
          time: existingMap[date] || '',
        }));
      });
    }
  }, [dateList, formData.timeMode]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Event name is required';
    if (!formData.type.trim()) newErrors.type = 'Event type is required';
    if (!formData.voiceId) newErrors.voiceId = 'Voice is required';

    if (formData.scheduleMode === 'date_range') {
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
      if (!formData.endDate) newErrors.endDate = 'End date is required';
      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (formData.scheduleMode === 'daily' || formData.timeMode === 'fixed') {
      if (!formData.fixedTime) newErrors.fixedTime = 'Time is required';
    }

    if (formData.scheduleMode === 'date_range' && formData.timeMode === 'custom') {
      const missingTimes = customSchedules.some(s => !s.time);
      if (missingTimes) newErrors.schedules = 'All dates must have a time set';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name,
      type: formData.type,
      voiceId: parseInt(formData.voiceId),
      scheduleMode: formData.scheduleMode,
      startDate: formData.scheduleMode === 'date_range' ? formData.startDate : null,
      endDate: formData.scheduleMode === 'date_range' ? formData.endDate : null,
      timeMode: formData.scheduleMode === 'daily' ? 'fixed' : formData.timeMode,
      fixedTime: (formData.scheduleMode === 'daily' || formData.timeMode === 'fixed') ? formData.fixedTime : null,
      isActive: formData.isActive,
      schedules: (formData.scheduleMode === 'date_range' && formData.timeMode === 'custom')
        ? customSchedules
        : [],
    };

    onSubmit(payload);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleScheduleTimeChange = (index, time) => {
    setCustomSchedules(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], time };
      return updated;
    });
    if (errors.schedules) {
      setErrors(prev => ({ ...prev, schedules: null }));
    }
  };

  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Section 1: Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Basic Info</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Event Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Sehri, Fazar, Isha"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Event Type</label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g. Azan, Elan, Reminder"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Voice</label>
          <select
            name="voiceId"
            value={formData.voiceId}
            onChange={handleChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select Voice</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          {errors.voiceId && <p className="text-red-400 text-sm mt-1">{errors.voiceId}</p>}
        </div>
      </div>

      {/* Section 2: Schedule Mode */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Schedule</h3>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scheduleMode"
              value="daily"
              checked={formData.scheduleMode === 'daily'}
              onChange={handleChange}
              className="text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-gray-300">Daily</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scheduleMode"
              value="date_range"
              checked={formData.scheduleMode === 'date_range'}
              onChange={handleChange}
              className="text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-gray-300">Date Range</span>
          </label>
        </div>

        {formData.scheduleMode === 'date_range' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.startDate && <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.endDate && <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Time Mode */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Time</h3>

        {formData.scheduleMode === 'date_range' && (
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="timeMode"
                value="fixed"
                checked={formData.timeMode === 'fixed'}
                onChange={handleChange}
                className="text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-gray-300">Fixed Time</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="timeMode"
                value="custom"
                checked={formData.timeMode === 'custom'}
                onChange={handleChange}
                className="text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-gray-300">Custom per Day</span>
            </label>
          </div>
        )}

        {(formData.scheduleMode === 'daily' || formData.timeMode === 'fixed') && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Time</label>
            <input
              type="time"
              name="fixedTime"
              value={formData.fixedTime}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.fixedTime && <p className="text-red-400 text-sm mt-1">{errors.fixedTime}</p>}
          </div>
        )}

        {formData.scheduleMode === 'date_range' && formData.timeMode === 'custom' && (
          <div>
            {dateList.length === 0 ? (
              <p className="text-gray-500 text-sm">Select a valid date range to set custom times</p>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-700 rounded-lg p-3">
                  {customSchedules.map((schedule, index) => (
                    <div key={schedule.date} className="flex items-center gap-3">
                      <span className="text-gray-300 text-sm w-32 shrink-0">
                        {formatDateLabel(schedule.date)}
                      </span>
                      <input
                        type="time"
                        value={schedule.time}
                        onChange={(e) => handleScheduleTimeChange(index, e.target.value)}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
                {errors.schedules && <p className="text-red-400 text-sm mt-1">{errors.schedules}</p>}
              </>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Active Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          id="eventIsActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
        />
        <label htmlFor="eventIsActive" className="text-sm text-gray-300">
          Active (event will trigger at scheduled times)
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
        >
          {isLoading ? 'Saving...' : event ? 'Update Event' : 'Add Event'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
