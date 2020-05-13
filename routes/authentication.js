const { Router } = require('express');
const router = new Router();

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const generateId = (length) => {
  console.log('generating the token');
  const characters =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += characters[Math.floor(Math.random() * characters.length)];
  }
  return token;
};

//const jwt = require('jsonwebtoken');

const User = require('./../models/user');
const bcryptjs = require('bcryptjs');

router.get('/', (req, res, next) => {
  console.log('welcole to the homepage');
  res.render('index');
});

router.get('/sign-up', (req, res, next) => {
  res.render('sign-up');
});

router.post('/sign-up', (req, res, next) => {
  const { name, email, password, confirmationCode } = req.body;
  bcryptjs
    .hash(password, 10)
    .then((hash) => {
      return User.create({
        name,
        email,
        status: 'Pending Confirmation',
        confirmationCode: generateId(20),
        passwordHash: hash,
      });
    })
    .then((user) => {
      console.log('welcome user', user);
      req.session.user = user._id;
      return transporter
        .sendMail({
          from: `Karen <${process.env.NODEMAILER_EMAIL}>`,
          to: 'bcdcIConfiormation email',
          text: 'Lorem Ipsum',
          html: `<a href="http://localhost:3000/auth/confirm/${token}">Verify your email</a>`,
        })

        .then((result) => {
          console.log('email sent');
          console.log(result);
        })
        .catch((error) => {
          console.log('there was en seding the email error');
        });
    })

    .then((user) => {
      res.redirect('/');
    })

    .catch((error) => {
      next(error);
    });
});

//calling method to send emails later
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL, //don't use your personal emails never for this.
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

router.get('/sign-in', (req, res, next) => {
  res.render('sign-in');
});

router.post('/sign-in', (req, res, next) => {
  let userId;
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return Promise.reject(new Error("There's no user with that email."));
      } else {
        userId = user._id;
        return bcryptjs.compare(password, user.passwordHash);
      }
    })
    .then((result) => {
      if (result) {
        req.session.user = userId;
        res.redirect('/');
      } else {
        return Promise.reject(new Error('Wrong password.'));
      }
    })
    .catch((error) => {
      next(error);
    });
});

router.post('/sign-out', (req, res, next) => {
  req.session.destroy();
  res.redirect('/');
});

const routeGuard = require('./../middleware/route-guard');

router.get('/private', routeGuard, (req, res, next) => {
  res.render('private');
});

module.exports = router;
