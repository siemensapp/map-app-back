const express = require('express');
const bodyParser = require('body-parser');
const api = require('./general-api');
const startServer = require('./mysql-connection');

const app = express();
app.use(bodyParser.json());
app.use('/api', api);

startServer();

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Listening on port ${port} ...`));