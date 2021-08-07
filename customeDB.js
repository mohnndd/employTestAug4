var sqlDb = require('mssql');
require('dotenv').config(); 

exports.executeSql = function (sql, config, callback) {

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