const mongoose = require('mongoose');


const options = {
    autoIndex: false, // Don't build indexes
    reconnectTries: 30, // Retry up to 30 times
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    useNewUrlParser: true
}


const startingMongoDB = () => {    
    const adress = process.env.DOCKER_DEPLOY? 'sa-bot-db': '127.0.0.1';    
    const database = process.env.DATABASE? process.env.DATABASE:'27017';
    mongoose.connect(`mongodb://${adress}:${database}/field-test`, options, (err) => {
        if(err) {
            console.log('Not connected to field-test')
            setTimeout(startingMongoDB, 5000)
        } else {
            console.log('Connected to field-test!')
        }
    })
        
}

module.exports = startingMongoDB;