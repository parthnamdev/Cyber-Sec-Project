const User = require("../models/userModel");
const passport = require('passport');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");

const login = (req, res, next) => {
    User.findOne({username: req.body.username}, function(err, foundUser){
        if(!err) {
            if(foundUser){
                const user = new User({
                    username: req.body.username,
                    password: req.body.password
                });
            
                req.login(user, function(err){
                    if(err){
                        console.log(err);
                        res.json({
                            message: "failed login or incorrect password"
                        });
                    } else{
                       passport.authenticate("local")(req, res, function(){
                           const userRedirect = 'verify/' + user.username;
                            res.redirect(userRedirect);
                        //     const token = jwt.sign({username: user.username}, process.env.JWT_SECRET, {expiresIn: '15m'} )
                        //     res.json({
                        //     meassge: "logged in successfully",
                        //     token: token
                        // });
                       }); 
                    
                    }
                });
            }
        } else {
            res.json({
                error: err
            });
        }
    });
}

const mail = (req, res) => {
    const transporter = nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASS,
        },
      });
    
      const mailOptions = {
        from: process.env.MAIL_USER, 
        to: 'bolodov232@brbqx.com', 
        subject: 'Hello ✔', 
        text: 'Hello world?' 
        //html: "<b>Hello world?</b>", // html body
      };
    
      transporter.sendMail(mailOptions, function(err, info) {
          if(err){
              res.json({
                  error: err
              });
          } else {
            console.log("Message sent: %s", info.messageId);
              res.json({
                  message: "mail sent",
                  response: info.response
              })
          }
      });
      
}

const twoStepVerification = (req, res) => {
    if(req.isAuthenticated()){
        console.log(req.params.username);
        const token = jwt.sign({username: req.params.username}, process.env.JWT_SECRET, {expiresIn: '15m'} )
        res.json({
        meassge: "logged in successfully",
        token: token
    });
    } else {
        res.json({
            message: "unauthorised"
        })
    }
    
}

const logout = (req, res) => {
    req.logout();
    res.json({
        message: "successfully logged out"
    });
}

module.exports = {
    login, logout, twoStepVerification, mail
}