"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      console.log(token)
      return res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (e) {
    return next(e);
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */
function ensureLoggedIn(req, res, next) {
    try {
      
      if (!res.locals.user) throw new UnauthorizedError();
      return next();
    } catch (e) {
      return next(e);
    }
  }

/** Middleware to use when they must provide a valid token & be user matching
 *  username provided as route param.
 *
 *  If not, raises Unauthorized.
 */
function ensureCurrentUser(req, res, next) {
    try { 
      const user = res.locals.user;
      if (!(user && user.username === req.params.username)) {
        throw new UnauthorizedError();
      }
      return next();
    } catch (e) {
      return next(e);
    }
  }
  
  module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    ensureCurrentUser
  };