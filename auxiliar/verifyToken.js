const jwt = require('jsonwebtoken');
const variables = require('./variables');

const verifyToken = (req, res, next) => {
    let token = req.headers['x-access-token'];
    if (!token) return res.send({auth: false, message: "No se encontro el token"});
    jwt.verify(token, variables.secret, (err, decoded) => {
        if (err) return res.send({auth: false, message: "Token no permitido"});
        next();
    })
}

module.exports = verifyToken;