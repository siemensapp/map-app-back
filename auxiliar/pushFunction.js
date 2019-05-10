const webpush = require('web-push');

/* ------------------------ FUNCIONES AUXILIARES ------------------------- */

function sendNotifications (subscription) {
    const notificationPayload = {
        notification: {
          title: 'New Notification',
          body: 'This is the body of the notification',
          icon: 'assets/icons/icon-512x512.png',
        },
    }

    let promises = [webpush.sendNotification(subscription, JSON.stringify(notificationPayload))];
    Promise.all(promises).then(() => console.log('Notificacion enviada'));
}

module.exports = {
    sendNotification: sendNotifications
}