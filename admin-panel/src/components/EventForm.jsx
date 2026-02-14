import { useState, useEffect, useMemo } from 'react';

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    weekdays: [],
    inactiveDays: [],
  });
  const [customSchedules, setCustomSchedules] = useState([]);
  const [errors, setErrors] = useState({});

  // Bulk time setter state
  const [bulkFrom, setBulkFrom] = useState('');
  const [bulkTo, setBulkTo] = useState('');
  const [bulkTime, setBulkTime] = useState('');

  // Custom period picker for daily/weekly + custom
  const [customPeriodStart, setCustomPeriodStart] = useState('');
  const [customPeriodEnd, setCustomPeriodEnd] = useState('');

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
        weekdays: event.weekdays || [],
        inactiveDays: event.inactiveDays || [],
      });
      if (event.schedules && event.schedules.length > 0) {
        setCustomSchedules(event.schedules.map(s => ({ date: s.date, time: s.time })));
        // Auto-detect custom period from existing schedules
        const dates = event.schedules.map(s => s.date).sort();
        if (dates.length > 0) {
          setCustomPeriodStart(dates[0]);
          setCustomPeriodEnd(dates[dates.length - 1]);
        }
      }
    }
  }, [event]);

  // Generate date list for date_range mode
  const dateRangeDateList = useMemo(() => {
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

  // Generate date list for daily/weekly + custom mode (from period picker)
  const customPeriodDateList = useMemo(() => {
    if (formData.scheduleMode === 'date_range') return [];
    if (!customPeriodStart || !customPeriodEnd) return [];
    const dates = [];
    const start = new Date(customPeriodStart);
    const end = new Date(customPeriodEnd);
    if (start > end) return [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (formData.scheduleMode === 'weekly') {
        // Only include dates matching selected weekdays
        const dayOfWeek = current.getDay();
        if (formData.weekdays.includes(dayOfWeek)) {
          dates.push(dateStr);
        }
      } else {
        // Daily mode - include all dates
        dates.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [formData.scheduleMode, customPeriodStart, customPeriodEnd, formData.weekdays]);

  // Combined date list based on mode
  const dateList = formData.scheduleMode === 'date_range' ? dateRangeDateList : customPeriodDateList;

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
    if (!formData.type) newErrors.type = 'Event type is required';
    if (!formData.voiceId) newErrors.voiceId = 'Voice is required';

    if (formData.scheduleMode === 'weekly') {
      if (formData.weekdays.length === 0) newErrors.weekdays = 'Select at least one weekday';
    }

    if (formData.scheduleMode === 'date_range') {
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
      if (!formData.endDate) newErrors.endDate = 'End date is required';
      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (formData.timeMode === 'fixed') {
      if (!formData.fixedTime) newErrors.fixedTime = 'Time is required';
    }

    if (formData.timeMode === 'custom') {
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
      weekdays: formData.scheduleMode === 'weekly' ? formData.weekdays : [],
      inactiveDays: formData.inactiveDays.length > 0 ? formData.inactiveDays : [],
      startDate: (formData.scheduleMode === 'date_range' || formData.scheduleMode === 'weekly') ? formData.startDate || null : null,
      endDate: (formData.scheduleMode === 'date_range' || formData.scheduleMode === 'weekly') ? formData.endDate || null : null,
      timeMode: formData.timeMode,
      fixedTime: formData.fixedTime || null,
      isActive: formData.isActive,
      schedules: formData.timeMode === 'custom' ? customSchedules : [],
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

  const toggleWeekday = (day) => {
    setFormData(prev => {
      const weekdays = prev.weekdays.includes(day)
        ? prev.weekdays.filter(d => d !== day)
        : [...prev.weekdays, day].sort();
      return { ...prev, weekdays };
    });
    if (errors.weekdays) setErrors(prev => ({ ...prev, weekdays: null }));
  };

  const toggleInactiveDay = (day) => {
    setFormData(prev => {
      const inactiveDays = prev.inactiveDays.includes(day)
        ? prev.inactiveDays.filter(d => d !== day)
        : [...prev.inactiveDays, day].sort();
      return { ...prev, inactiveDays };
    });
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

  const applyBulkTime = () => {
    if (!bulkTime) return;
    setCustomSchedules(prev =>
      prev.map(s => {
        if ((!bulkFrom || s.date >= bulkFrom) && (!bulkTo || s.date <= bulkTo)) {
          return { ...s, time: bulkTime };
        }
        return s;
      })
    );
    if (errors.schedules) setErrors(prev => ({ ...prev, schedules: null }));
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
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select Type</option>
              <option value="azan">Azan</option>
              <option value="other">Other</option>
            </select>
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
              value="weekly"
              checked={formData.scheduleMode === 'weekly'}
              onChange={handleChange}
              className="text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-gray-300">Weekly</span>
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

        {/* Weekly: Weekday selector */}
        {formData.scheduleMode === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Days</label>
            <div className="flex gap-2">
              {WEEKDAY_NAMES.map((name, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleWeekday(index)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.weekdays.includes(index)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            {errors.weekdays && <p className="text-red-400 text-sm mt-1">{errors.weekdays}</p>}
          </div>
        )}

        {/* Date range: Start/End dates */}
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

        {/* Weekly: Optional date bounds */}
        {formData.scheduleMode === 'weekly' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Start Date <span className="text-gray-500">(Optional)</span></label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">End Date <span className="text-gray-500">(Optional)</span></label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Time Mode */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Time</h3>

        {/* Time mode toggle - shown for ALL schedule modes */}
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

        {/* Fixed time input */}
        {formData.timeMode === 'fixed' && (
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

        {/* Custom time mode */}
        {formData.timeMode === 'custom' && (
          <div className="space-y-4">
            {/* Fallback time */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fallback Time <span className="text-gray-500">(used when no custom time set for a day)</span>
              </label>
              <input
                type="time"
                name="fixedTime"
                value={formData.fixedTime}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Period picker for daily/weekly + custom */}
            {(formData.scheduleMode === 'daily' || formData.scheduleMode === 'weekly') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Configure From</label>
                  <input
                    type="date"
                    value={customPeriodStart}
                    onChange={(e) => setCustomPeriodStart(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Configure To</label>
                  <input
                    type="date"
                    value={customPeriodEnd}
                    onChange={(e) => setCustomPeriodEnd(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Bulk time setter */}
            {dateList.length > 0 && (
              <div className="bg-gray-750 border border-gray-600 rounded-lg p-3 space-y-2">
                <label className="block text-sm font-medium text-gray-300">Bulk Set Time</label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={bulkFrom}
                      onChange={(e) => setBulkFrom(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={bulkTo}
                      onChange={(e) => setBulkTo(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Time</label>
                    <input
                      type="time"
                      value={bulkTime}
                      onChange={(e) => setBulkTime(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyBulkTime}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 rounded transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* Per-day time list */}
            {dateList.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {formData.scheduleMode === 'date_range'
                  ? 'Select a valid date range to set custom times'
                  : 'Set the "Configure From" and "Configure To" dates above to configure per-day times'}
              </p>
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

      {/* Section 4: Skip Days */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Skip Days <span className="normal-case font-normal">(Optional)</span></h3>
        <p className="text-gray-500 text-xs">Days when this event should NOT trigger</p>
        <div className="flex gap-2">
          {WEEKDAY_NAMES.map((name, index) => (
            <button
              key={index}
              type="button"
              onClick={() => toggleInactiveDay(index)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                formData.inactiveDays.includes(index)
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Section 5: Active Status */}
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
