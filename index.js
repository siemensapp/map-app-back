const express = require('express');
const bodyParser = require('body-parser');
const api = require('./general-api');



const app = express();
app.use(bodyParser.json({limit: '10mb'}));
app.use('/api', api.router);
app.use(bodyParser.urlencoded({extended: true, limit: '10mb'}));

api.startingMysql();

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Listening on port ${port} ...`));