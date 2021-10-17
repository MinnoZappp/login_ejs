// 1.include the packages in our Node.js
var mysql = require("mysql");
var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
var path = require("path");

// 2.connect to our database
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "nodelogin"
  });

// 3.use Packages
var app = express();
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'ejs');

// 4.change the secret code for the sessions
// sessions package is what we'll use to determine 
// if the user is logged-in, 
// the bodyParser package will extract the form data 
// from our login.html
app.use(
    session({
      secret: "secret",
      resave: true,
      saveUninitialized: true
    })
  );
  // app.use(bodyParser.urlencoded({ extended: true }));
  // app.use(bodyParser.json()); /2อันนี้เป็นแบบเก่า มันยกเลิกไปแล้ว
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());    //เรียกใช้jsonผ่านตัวexpress

// 5.the client connects to the server
//  the login page will be displayed, 
// the server will send the login.html file.
app.get("/login", function(request, response) {    //ทำการสร้างapiขึ้นมา apiแรกชื่อlogin 
    response.sendFile(path.join(__dirname + "/login.html"));
  });
  
  //  6. handle the POST request,
  // form data will be sent to the server, 
  // and with that data our login script will check in our MySQL accounts table
  app.post("/auth", function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
  
  
    if (username && password) {
      connection.query(
        "SELECT * FROM accounts WHERE username = ? AND password = ?",
        [username, password],//เรากรอกusername passwและกดsubmitปั๊ป พอเช็คแล้วมีในdatabase แปลว่าloginสำเร็จ
        function(error, results, fields) {  //ค่าก็จะถูกเก็บมาที่objectที่ชื่อresults
            // console.log(username);
          if (results.length > 0) { //ถ้าobject resultค.ยาวมากกว่า0
            request.session.loggedin = true;
            request.session.username = username;//จะเก็บsessionไว้
            // response.redirect("/home");
            response.redirect("/webboard");//และทำการredirectไปที่webboard
          } else {
            response.send("Incorrect Username and/or Password!");
          }
          response.end();
        }
      );
    } else {
      response.send("Please enter Username and Password!");
      response.end();
    }
  });

  // 7.The home page we can handle with another GET request:
app.get("/home", function(request, response) {
    if (request.session.loggedin) {
       response.send("Welcome back, " + request.session.username + "!");
      //response.redirect("/webboard");
    } else {
      response.send("Please login to view this page!");
    }
    response.end();
  });
  
  app.get("/signout", function(request, response) {//เขียนเป็นfunc.ปกติ
      request.session.destroy(function (err) {
            response.send("Signout ready!");
            response.end();
      });
  });
  
  app.get("/webboard", (req, res) => { //เป็นapiที่ถูกเรียกมาจากตัวข้างบน ถูกเรียกเมื่อเราloginสำเร็จ //เขียนเป็นarrow func.
      if (req.session.loggedin) //ทำการเช็คว่าเราloginอยู่จริงรึป่าว ก่อนที่เราจะทำอะไรที่menuจะต้องตรวจสอบการloginอยู่เสมอ 
                                //เพื่อไม่ให้userคนไหนก็ตามเข้าไปถึงเมนูบางเมนุที่ไม่ควรเข้า
                                //ถ้าใครไม่ได้กดloginเข้ามาแล้วเข้าเมนูต่างๆก้จะเข้าไม่ได้ ดังนั้นตัวsessionตัวนี้จะเป็นตัวตรวจสอบ
                                // (req.session.loggedin) มันจะเข้ากับtrue มีอยู่ตริงรึป่าว
        connection.query("SELECT * FROM accounts", (err, result) => { //เอาข้อมูลทุกตัวที่อยู่ในdatabase accountsออกมาโชว์ให้หมด
                                                                      //ถ้าเราดึงค่าไม่ลงresultจะมีค่า  
          res.render("index.ejs", { //ถ้าดึงค่ามาสำเร็จมันจะทำการrenderไปที่index.ejs ซึ่งindex.ejsก็คือhtmlแต่การrenderไม่สามารถrenderด้วยไฟล์htmlได้
            posts: result //โดยส่งresultsเข้าไปในpost แล้วก้ส่งpostไปที่index.ejs
          });
        console.log(result);
        });
      else
        res.send("You must to login First!!!");
        console.log("You must to login First!!!");
        // res.end();
  });
  
  app.get("/add", (req, res) => { //api add เมื่อเรากดปุ่มaddเมื่อไหร่มันจะกระโดดมาที่ตรงนี้ และในหน้าเว็บมันจะเรียกฟอร์มและขึ้นนให้เรากรอก
    res.render("add.ejs");//แล้วไปrenderที่add ejsไฟล์ จะใส่ejsหรือไม่ใส่ก้ได้
  });//api addมีอยู่2ส่วน ส่วนของgetกับpost method
  
  app.post("/add", (req, res) => { //post methodคือตอนที่addข้อมูลหรือกรอกเสร็จและsubmitแล้ว และข้อมูลเพิ่มขึ้นมา อันนั้นคือpost
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email; //ตรงreq3อันนี้ ใช้หน้าที่ของbody-parserทั้งหมด
    const post = { //ตัวpost เหมือนตัวdictonaryที่มีkeyและvalueในการดึงไปใช้งาน
      username: username,
      password: password,
      email: email
    };
    if (req.session.loggedin) //ถ้าsessionloginยังทำงานอยู่ก้ให้insertแต่ถ้าเข้ามาโดยไม่ได้login มันก็จะไม่ทำงาน
      connection.query("INSERT INTO accounts SET ?", post, (err) => { //?คือค่าvalueที่เราใส่ โดยใส่จากpost postมาจากไฟลือีกไฟล์หนึ่งที่ส่งเข้ามา.ejs
        console.log("Data Inserted");
        return res.redirect("/webboard");//insertสำเร็จมันจะredirectไปที่api webboard
      });
    else res.send("You must to login First!!!"); //และกระโดดมาที่ตรงนี้
    console.log("You must to login First!!!");
    //   res.end();
  });
  
  app.get("/edit/:id", (req, res) => {
    const edit_postID = req.params.id;
  
    connection.query(
      "SELECT * FROM accounts WHERE id=?",
      [edit_postID],
      (err, results) => {
        if (results) {
          res.render("edit", {
            post: results[0],
          });
        }
      }
    );
  });
  
  app.post("/edit/:id", (req, res) => {
    const update_username = req.body.username;
    const update_password = req.body.password;
    const update_email = req.body.email;
    const id = req.params.id;
    connection.query(
      "UPDATE accounts SET username = ?,password = ? ,email = ? WHERE id = ?",
      [update_username, update_password, update_email, id],
      (err, results) => {
        if (results.changedRows === 1) {
          console.log("Post Updated");
        }
        return res.redirect("/webboard");
      }
    );
  });
  
  //running port 9000
  app.listen(9000);
  console.log("running on port 9000...");