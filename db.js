var sqlDb = require('mssql');
require('dotenv').config(); 

const DBUser = process.env.DATABASE_USER;
const DBpassword = process.env.DATABASE_PASSWORD;
const databaseName = process.env.DATABASE_NAME
const databaseServer = process.env.DATABASE_SERVER;

  const config = {
    user: DBUser,
    password: DBpassword,
    server: databaseServer,
    trustServerCertificate: true,
    database: databaseName,
  };

exports.executeSql = function (sql, callback) {

    sqlDb.connect(config, function (err) {
    
        if (err) console.log(err);

        var request = new sqlDb.Request();
           
        request.query(sql, function (err, recordset) {
            
            if (err) {
                console.log(err)
                callback(err);
            }
            else {
                callback(recordset);
            }
            
        });
    });

};