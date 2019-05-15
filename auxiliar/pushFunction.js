const webpush = require('web-push');

/* ------------------------ FUNCIONES AUXILIARES ------------------------- */

function notifNewAssignment (subscription, type) {
    console.log("ENTRA A NOTIFNEWASSIGNMENT");
    var notificationPayload = {};
    switch( type ) {
        case 'newAssignment':
            notificationPayload['notification'] = {
                title: 'Field Service',
                body: 'Hay una nueva asignación disponible',
                icon: 'assets/images/icon.png',
            }
            break;
        
        case 'assignmentStarted':
            notificationPayload['notification'] = {
                title: 'Field Service',
                body: 'Se inicio la asignación',
                icon: 'assets/images/icon.png',
            }
            break;
    }
    Promise.resolve( webpush.sendNotification(subscription, JSON.stringify(notificationPayload)) ).then(() => console.log('Notificacion enviada al APP'));
}

module.exports = {
    notifNewAssignment: notifNewAssignment,
}