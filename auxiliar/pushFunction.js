const webpush = require('web-push');

/* ------------------------ FUNCIONES AUXILIARES ------------------------- */

function notifNewAssignment (subscription) {
    const notificationPayload = {
        notification: {
            title: 'Field Service',
            body: 'Hay una nueva asignacion disponible',
            icon: 'assets/images/icon.png',
        },
    }
    Promise.resolve( webpush.sendNotification(subscription, JSON.stringify(notificationPayload)) ).then(() => console.log('Notificacion enviada al APP'));
}

module.exports = {
    notifNewAssignment: notifNewAssignment,
}