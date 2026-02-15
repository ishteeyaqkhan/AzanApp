const { Expo } = require('expo-server-sdk');
const { DeviceToken } = require('../models');

const expo = new Expo();

/**
 * Send a visible push notification to all registered devices.
 * Used for azan triggers — shows notification with sound.
 */
async function sendPushToAll(title, body, data = {}, channelId = 'prayer-times') {
  const devices = await DeviceToken.findAll();
  if (devices.length === 0) return;

  const messages = [];
  for (const device of devices) {
    if (!Expo.isExpoPushToken(device.token)) {
      console.warn(`Invalid Expo push token: ${device.token}`);
      continue;
    }

    messages.push({
      to: device.token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId,
    });
  }

  if (messages.length === 0) return;

  console.log(`[Push] Sending to ${messages.length} device(s)`);

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      // Clean up invalid tokens
      for (let i = 0; i < receipts.length; i++) {
        if (receipts[i].status === 'error' && receipts[i].details?.error === 'DeviceNotRegistered') {
          const badToken = chunk[i].to;
          console.log(`Removing invalid token: ${badToken}`);
          await DeviceToken.destroy({ where: { token: badToken } });
        }
      }
    } catch (error) {
      console.error('Error sending push chunk:', error);
    }
  }
}

/**
 * Send a silent/data-only push to all registered devices.
 * Used for admin data changes — wakes app to re-fetch data.
 */
async function sendSilentPushToAll(data = {}) {
  const devices = await DeviceToken.findAll();
  if (devices.length === 0) return;

  const messages = [];
  for (const device of devices) {
    if (!Expo.isExpoPushToken(device.token)) continue;

    messages.push({
      to: device.token,
      data,
      priority: 'high',
      _contentAvailable: true,
    });
  }

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < receipts.length; i++) {
        if (receipts[i].status === 'error' && receipts[i].details?.error === 'DeviceNotRegistered') {
          const badToken = chunk[i].to;
          await DeviceToken.destroy({ where: { token: badToken } });
        }
      }
    } catch (error) {
      console.error('Error sending silent push chunk:', error);
    }
  }
}

module.exports = { sendPushToAll, sendSilentPushToAll };
