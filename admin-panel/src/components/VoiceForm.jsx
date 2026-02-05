import { useState, useEffect } from 'react';

export default function VoiceForm({ voice, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
  });
  const [audioFile, setAudioFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (voice) {
      setFormData({
        name: voice.name || '',
        isActive: voice.isActive !== undefined ? voice.isActive : true,
      });
    }
  }, [voice]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Voice name is required';
    if (!voice && !audioFile) newErrors.audio = 'Audio file is required for new voices';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = new FormData();
    data.append('name', formData.name);
    data.append('isActive', formData.isActive);
    if (audioFile) {
      data.append('soundFile', audioFile);
    }

    onSubmit(data);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setErrors((prev) => ({ ...prev, audio: 'Please select an audio file' }));
        return;
      }
      setAudioFile(file);
      setErrors((prev) => ({ ...prev, audio: null }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Voice Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Voice Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Azan Makkah, Sehri Alarm"
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Audio File */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Audio File {voice && <span className="text-gray-500">(optional for edit)</span>}
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:cursor-pointer"
        />
        {audioFile && (
          <p className="text-emerald-400 text-sm mt-1">Selected: {audioFile.name}</p>
        )}
        {voice?.soundFile && !audioFile && (
          <p className="text-gray-400 text-sm mt-1">Current audio file will be kept</p>
        )}
        {errors.audio && <p className="text-red-400 text-sm mt-1">{errors.audio}</p>}
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          id="voiceIsActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
        />
        <label htmlFor="voiceIsActive" className="text-sm text-gray-300">
          Active (available for events)
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
        >
          {isLoading ? 'Saving...' : voice ? 'Update Voice' : 'Add Voice'}
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
