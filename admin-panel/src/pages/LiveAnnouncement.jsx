import { useState, useRef, useEffect } from 'react';
import { broadcastAnnouncement } from '../services/api';

export default function LiveAnnouncement() {
  const [status, setStatus] = useState('idle'); // idle | recording | uploading | success | error
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [title, setTitle] = useState('Live Announcement');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError('');
      setSuccess('');
      setAudioBlob(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(250);
      setStatus('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permission.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setStatus('idle');
  };

  const handleBroadcast = async () => {
    if (!audioBlob) return;
    try {
      setStatus('uploading');
      setError('');

      const formData = new FormData();
      formData.append('audioFile', audioBlob, 'announcement.webm');
      formData.append('title', title);

      await broadcastAnnouncement(formData);

      setSuccess('Announcement broadcast successfully!');
      setStatus('success');
      setAudioBlob(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setRecordingTime(0);

      setTimeout(() => {
        setSuccess('');
        setStatus('idle');
      }, 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to broadcast announcement');
      setStatus('error');
    }
  };

  const handleDiscard = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
    setStatus('idle');
    setError('');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Live Announcement</h1>
        <p className="text-gray-400 mt-1">Record and broadcast announcements to all connected devices</p>
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

      {/* Title Input */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Announcement Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Enter announcement title"
          disabled={status === 'recording' || status === 'uploading'}
        />
      </div>

      {/* Recording Card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-8">
        <div className="flex flex-col items-center">
          {/* Status Indicator */}
          <div className="mb-6">
            {status === 'recording' ? (
              <div className="flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
                <span className="text-red-400 font-semibold text-lg">Recording</span>
              </div>
            ) : status === 'uploading' ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                <span className="text-emerald-400 font-semibold text-lg">Broadcasting...</span>
              </div>
            ) : (
              <span className="text-gray-400 text-lg">Ready to record</span>
            )}
          </div>

          {/* Timer */}
          {(status === 'recording' || audioBlob) && (
            <div className="text-4xl font-mono text-white mb-6">
              {formatTime(recordingTime)}
            </div>
          )}

          {/* Waveform indicator during recording */}
          {status === 'recording' && (
            <div className="flex items-end gap-1 h-12 mb-6">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-emerald-500 rounded-full animate-pulse"
                  style={{
                    height: `${20 + Math.random() * 80}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.4 + Math.random() * 0.4}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Audio Preview */}
          {audioUrl && status !== 'recording' && (
            <div className="w-full max-w-md mb-6">
              <p className="text-gray-400 text-sm mb-2 text-center">Preview your recording</p>
              <audio ref={audioRef} src={audioUrl} controls className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {status === 'idle' && !audioBlob && (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Go Live
              </button>
            )}

            {status === 'recording' && (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Stop Recording
              </button>
            )}

            {audioBlob && status !== 'recording' && status !== 'uploading' && (
              <>
                <button
                  onClick={handleDiscard}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Discard
                </button>
                <button
                  onClick={handleBroadcast}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 15.828a5 5 0 010-7.656m5.656 0a5 5 0 010 7.656M12 12h.01" />
                  </svg>
                  Broadcast
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-white font-semibold mb-3">How it works</h3>
        <div className="space-y-2 text-gray-400 text-sm">
          <p>1. Click <strong className="text-emerald-400">Go Live</strong> and grant microphone access</p>
          <p>2. Record your announcement message</p>
          <p>3. Preview the recording and click <strong className="text-emerald-400">Broadcast</strong></p>
          <p>4. All connected mobile apps will instantly receive and auto-play the announcement</p>
        </div>
      </div>
    </div>
  );
}
