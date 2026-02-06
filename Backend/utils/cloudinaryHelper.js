const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

function getCloudinaryPublicId(url) {
  if (!url || !url.startsWith('http')) return null;
  // URL format: https://res.cloudinary.com/<cloud>/video/upload/v123/azan-audio/filename.mp3
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  const afterUpload = parts[1]; // e.g. "v123/azan-audio/filename.mp3"
  // Remove version prefix (v123/)
  const withoutVersion = afterUpload.replace(/^v\d+\//, '');
  // Remove file extension
  return withoutVersion.replace(/\.[^.]+$/, '');
}

async function deleteCloudinaryFile(url) {
  if (!isCloudinaryConfigured || !url || !url.startsWith('http')) return;
  const publicId = getCloudinaryPublicId(url);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch (err) {
      console.error('Cloudinary delete error:', err);
    }
  }
}

module.exports = { getCloudinaryPublicId, deleteCloudinaryFile };
