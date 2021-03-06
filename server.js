require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const morgan = require("morgan");
const passport = require("passport");
const cors = require('cors');
const helmet = require('helmet');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')(expressSession);
const { body, validationResult } = require('express-validator');
const app = express();

app.use(cors());
app.use(helmet());
const jwt = require("jsonwebtoken");
const User =  require('./models/userModel');
const fs = require('fs');

const userRouter = require("./routes/userRoutes");
const articleRouter = require("./routes/articleRoutes");
const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/adminRoutes');
const nullRouter = require('./routes/nullRoutes');

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use((req,res,next) => {
    res.setHeader('Access-Control-Allow-Credentials','true');
    next();
})
// app.use( mediaAccess, express.static(__dirname + "/uploads"));
app.use(expressSession({secret: process.env.SESSION_SECRET, saveUninitialized: false, resave: false, cookie: { maxAge: 60*60*1000 }, store: new MongoStore({mongooseConnection: mongoose.connection, autoRemove: 'interval', autoRemoveInterval: 60})}));
app.use(passport.initialize());
app.use(passport.session());

const uri = `${"mongodb+srv://"+process.env.ATLAS_USER+":"+process.env.ATLAS_PASSWORD+"@"+process.env.ATLAS_CLUSTER+".dcdll.mongodb.net/"+process.env.ATLAS_DB_NAME+"?retryWrites=true&w=majority"}`;
mongoose.connect(uri, { useNewUrlParser:true, useUnifiedTopology:true, useCreateIndex: true });
const db = mongoose.connection;

db.on("error", (err) => {
    console.log(err);
});

db.once("open", () => {
    User.find({},(err,found) => {
        found.forEach(element => {
            const create_folder = `${"./uploads/" + element.uuid}`;
            fs.mkdir(create_folder, {recursive: true}, function(err) {
                if(err) throw err;
            });
        });
        found.forEach(element => {
            const create_folder = `${"./downloads/" + element.uuid}`;
            fs.mkdir(create_folder, {recursive: true}, function(err) {
                if(err) throw err;
            });
        });
    });
    console.log("database connected");
});

app.use(morgan('common'));

app.use("/api/user", userRouter);
app.use("/api/article", articleRouter);
app.use("/api", authRouter);
app.use("/admin", adminRouter);

const port_num = process.env.PORT || 5000;
app.listen( port_num, function() {
    console.log("Server connected at port " + port_num + "...");
});

app.use("*", nullRouter);