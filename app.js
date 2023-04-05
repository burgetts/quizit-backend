// "use strict";

/** Express app for jobly. */

const express = require("express");
const cors = require("cors");
const flashcardRoutes = require('./routes/flashcards')
const userRoutes = require('./routes/users')
const authRoutes = require('./routes/auth')
const setRoutes = require('./routes/sets')
const groupRoutes = require('./routes/groups')

const { NotFoundError } = require("./expressError");
const {authenticateJWT} = require('./middleware/auth')

// const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(express.json());

// app.use(morgan("tiny"));
app.use('/auth', authRoutes)
app.use(authenticateJWT)
app.use('/flashcards', flashcardRoutes)
app.use('/users', userRoutes)
app.use('/sets', setRoutes)
app.use('/groups', groupRoutes)



/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;