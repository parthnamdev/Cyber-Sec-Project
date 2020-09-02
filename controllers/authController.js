const User = require("../models/userModel");
const axios = require('axios');
const passport = require("passport");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { totp } = require('otplib');
totp.options = { 
    digits: 8,
    step: 120
   };
const opts = totp.options;
const secret = process.env.TOTP_SECRET;
// const toptToken = totp.generate(secret);

const login = (req, res, next) => {
  if(req.isAuthenticated() === true){
    const userRedirect = "mail";
    res.redirect(userRedirect);
  } else {
    User.findOne({ username: req.body.username }, function (err, foundUser) {
      if (!err) {
        if (foundUser) {
          const user = new User({
            username: req.body.username,
            password: req.body.password,
          });
  
          req.login(user, function (err) {
            if (err) {
              console.log(err);
              res.json({
                status: "failure",
                message: "failed login or incorrect password",
                errors: err,
                data: {}
              });
            } else {
              passport.authenticate("local")(req, res, function () {
                // const userRedirect = "verify/" + user.username;
                // res.redirect(userRedirect);
                const userRedirect = "mail";
                res.redirect(userRedirect);
                //     const token = jwt.sign({username: user.username}, process.env.JWT_SECRET, {expiresIn: '15m'} )
                //     res.json({
                //     meassge: "logged in successfully",
                //     token: token
                // });
              });
            }
          });
        } else {
          res.json({
            status: "failure",
            message: "no user found",
            errors: [],
            data: {}
          })
        }
      } else {
        res.json({
          status: "failure",
          message: "",
          errors: err,
          data: {}
        });
      }
    });
  }
  
};

const mail = async (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "SendGrid",
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASS,
    },
  });

  const toptToken = totp.generate(secret);
  const textMsg = `${"Your One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for 2 mins only"}`;
  const toUser = req.user.email;

  const mailOptions = {
    from: {
            name: 'Syncure app',
            address: process.env.MAIL_USER
          },
    to: toUser,
    subject: "OTP - Authentication - Syncure app",
    text: textMsg,
  };

  const info = await transporter.sendMail(mailOptions).catch((err) => {
    res.json({
      status: "failure",
      message: "",
      errors: err,
      data: {}
    });
  });
  console.log(`Mail sent to : ${info.messageId}`);
  return res.json({
    status: "success",
    message: "Mail Sent",
    errors: [],
    data: {
      response: info.response,
      timeRemaining: totp.timeRemaining()
    }
    
  });
};

const twoStepVerification = (req, res) => {

  const isValid = totp.check(req.body.totp, secret);
  //console.log(isValid);
  if (req.isAuthenticated() && isValid == true) {
    
    const token = jwt.sign(
      { username: req.params.username },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.json({
      status: "success",
      meassge: "logged in successfully",
      errors: [],
      data: {
        token: token
      }
      
    });
  } else {
    res.json({
      status: "failure",
      message: "unauthorised or 2FA failed",
      errors: [],
      data: {}
    });
  }
};

const logout = (req, res) => {
  if(req.isAuthenticated()) {
  axios.put('https://cloud-api.yandex.net/v1/disk/resources/unpublish', null, { params: { path: '/Syncure_data/'+req.user.username}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
  .then( response => {
    // res.json(response);
    req.logout();
    res.json({
      status: "success",
      message: "successfully logged out",
      errors: [],
      data: {}
    });
  })
  .catch(errr => {res.send("err in logging out");});
  } else {
    res.json({
      status: "failure",
      message: "already logged out",
      errors: [],
      data: {}
    });
  }
};

module.exports = {
  login,
  logout,
  twoStepVerification,
  mail
};