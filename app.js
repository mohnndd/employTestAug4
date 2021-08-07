/**
 * 
 * Subject: test from undisclosed employer 
 * Name: Muhannad Alduraywish
 * 
 * Task:
 * Container: Pending
 * .ENV dominstration : Completed
 * Database connection: Completed
 * Authentication: Compelted
 * Authorization: Completed
 * Registration: Completed
 * REST endpoints: Completed 
 * SP dominstration: Completed 
 * JSON Object as main object: Completed 
 * Get string connection to another database using the defult database: Completed 
 * log trail: Completed 
 */


//library to be used
const express = require("express");
const app = express();
const sql = require("mssql");
const bodyParser = require('body-parser');
require('dotenv').config(); 
var db = require('./db');
var customeDB = require('./customeDB');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


//definitions  
const port = 8080 || process.env.PORT;
const saltRounds = 10 || process.env.SALT;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req,res)=> {

    res.send('hello world!');

});

//exeucte SP, from customer database where the user will pass the config for the BD, and store saved SP 
app.get('/executeSP', authenticateToken, (req, res) => {

    //store SP as variable 
    var spNumber = req.headers.spNumber;

    //store the config file as JSON object
    const config = {
        user: req.body.dbUser,
        password: req.body.dbPassword,
        server: req.body.server,
        trustServerCertificate: true,
        database: req.body.databaseName,
      };

      //execute the SP from the header 
      db.executeSql("SELECT [command] FROM [GulfUnion].[dbo].[StoredProcedures] where InputAttribute = "+spNumber, (err) => {

        customeDB.executeSql(recordset.recordset[0],config, (recordset, err) => {
                if (err) console.log(err)

                //log the process 
                logTrail('fetched Stored Procedures #'+spNumber,'sucessfull', 'N/A', res.user.name);

                //return the recordset
                res.json(recordset.recordset);
                
        });
      });    
});

//to get all stored database rwos from the DB
app.get('/getalldatabaselist', authenticateToken, (req, res) => {

    db.executeSql('select * from databaseList', async (recordset, err) => {
        
        if (err) console.log(err);
        
        //console.log(recordset)
        logTrail('get getalldatabaselist','sucessfull', 'N/A', req.body.email);
        return res.send(recordset.recordset).status(200);
    });

});


//to get the user table from defined DB by the REST headers 
app.get('/getuserfromspeificedatabase', authenticateToken, (req, res) => {

    const config = {
        user: req.body.dbUser,
        password: req.body.dbPassword,
        server: req.body.server,
        trustServerCertificate: true,
        database: req.body.databaseName,
      };

      //use the custoemDB JS object 
      customeDB.executeSql('select * from staff', config, (recordset, err) => {
        
        if (err) console.log(err);

        //log trail the process 
        logTrail('get getuserfromspeificedatabase','sucessfull', 'N/A', req.body.email);
        return res.send(recordset.recordset).status(200);

    }) 

});

//demonstration of database connectivity and async programing
app.post('/createuser', async (req, res) => {

    //check for input validation from the server-side
    if (req.body.firstName === undefined) {
        logTrail('undefined first name','faild', 'N/A', 'N/A');
        return res.status(400).send({'status' : 'first name is not defined'})
    }
    if (req.body.lastName === undefined) {
        logTrail('undefined last name','faild', 'N/A', 'N/A');
        return res.status(400).send({'status' : 'last name is not defined'})
    }
    if (req.body.email === undefined) {
        logTrail('undefined email','faild', 'N/A', 'N/A');
        return res.status(400).send({'status' : 'email is not defined'})
    }
    if (req.body.password === undefined) {
        logTrail('undefined password','faild', 'N/A', 'N/A');
        return res.status(400).send({'status' : 'password is not defined'})
    }
    if (req.body.password.length < 6) {
        logTrail('password input not according to policy','faild', 'N/A', 'N/A');
        return res.status(400).send({'status' : 'password policy error'})
    }

    //check if the primery email have been used before
    db.executeSql("select COUNT(*) as count from users where email = '"+req.body.email+"'", async (recordset, err) => {
        
        if (err) res.status(500);



        if (recordset.recordset[0].count > 0) {
            logTrail('user try to register again','faild', 'low', req.body.email);
            return res.status(400).send({"status" : "user already exist"});            
        }

        //hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    //insert the date into SQL
    db.executeSql("insert into users (firstName, lastName, email, password) values ('"+req.body.firstName+"','"+req.body.lastName+"','"+req.body.email+"','"+hashedPassword+"')", function (err){
        
         if (err) res.status(500); 

         logTrail('token issued','sucessfull', 'N/A', req.body.email);
         return res.status(200).send({'status' : "sucessfull"}).end();

     });

    });

});

//demonstration of database authentication
app.post('/login', (req, res) => {


    //find the user information 
  db.executeSql("select [password] from users where email ='"+req.body.email+"'", async (recordset, result, err) => {  

    if (err) {
        
        res.json({"status" : "system failuer"}).status(500);
    }

    //if user dos not exist 
    else if (recordset.recordset[0]===undefined) {
        
        return res.status(400).send({"status" : "user dos not exist"})
    }

    // for wrong input 
    else if (recordset.recordset[0].password!=req.body.password){
        logTrail('user login failer due to incorrect password','faild', 'medium', req.body.email);
        return res.status(403).send({"status" : "credentials do not match"})
    }

    // for correct input scenario 
    else if (recordset.recordset[0].password===req.body.password) {

    const accessToken = jwt.sign({name :req.body.email }, process.env.Access_Token_Secret, {expiresIn: process.env.JWT_EXPIRES_IN});
    logTrail('sucessfull login','sucessfull', 'N/A', req.body.email);
    db.executeSql("insert into tokens (token, email) values ('"+accessToken+"','"+req.body.email+"')", (err) => {

        if (err) {
            console.log(err);
        }

    });

    //issue token and show sucess massage 
    res.json({"status": "sucessfull" , "token" : accessToken}).status(200);

    }

 });

});


//demonstration of database authorization
app.get('/profile' ,authenticateToken, (req, res) => {

    db.executeSql("select firstName, lastName from users where email = '"+res.user.name+"'" , (recordset) => {
        
        const firstName = recordset.recordset[0].firstName;
        const lastName = recordset.recordset[0].lastName;
        logTrail('fetched profile','sucessfull', 'N/A', res.user.name);

        res.json({status : "sucessfull", firstName: firstName, lastName: lastName});
    });

});

//middleware to verify the tokens and parse the token content
function authenticateToken (req, res, next) {

    //strip the token from bearer string and space
    const authHeader = String(req.headers['authorization'] || '');
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(403).json({status: "session error"}); 
    }

    jwt.verify(token, process.env.Access_Token_Secret, (err, user) => {

        if (err) return res.sendStatus(403).json({status: "session expired"});   

        res.user = user;

        next();

    });

};

//as per the requirements, log trail
function logTrail (event, result, criticality ,userName) {

    db.executeSql("insert into log (event, result, criticality, userName) values ('"+event+"','"+result+"','"+criticality+"','"+userName+"')", (err) => {
        if (err) console.log(err);
    });

};

//start express server
app.listen(port, () => {
    console.log("Server started");
  });