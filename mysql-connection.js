const mysql = require('mysql');

const startingMysql = () => {
    const adress = process.env.DOCKER_DEPLOY? 'cmms-db': '127.0.0.1';    
    var con = mysql.createConnection({
        host: adress,
        database: 'fieldservice',
        user: 'root',
        password: 'admin',
        insecureAuth: true
    });
    
    con.connect( (err) => {
        if (err){
            console.log("Not connected to Mysql, Retrying ...");
            //console.log(err);
            setTimeout(startingMysql, 5000);
        } else {
            console.log("Connected to Mysql!");
        }
    });

}

module.exports = startingMysql;