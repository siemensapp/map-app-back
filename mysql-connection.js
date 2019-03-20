const mysql = require('mysql');

const startingMysql = () => {    
    var con = mysql.createConnection({
        host: 'localhost',
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