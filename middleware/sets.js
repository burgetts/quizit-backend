"use strict";

/** Convenience middleware to handle common auth cases in set routes. */

const { UnauthorizedError } = require("../expressError");
const Flashcard = require('../models/flashcard')
const User = require('../models/user')
const Set = require('../models/set')

  /** Middleware to use when current user must own set they are trying to edit.
   *  For set routes.
   * 
   *  If not, raises Unauthorized
   */
  async function ensureSetOwner(req, res, next){
    try {
      let setId = req.params.id 
      const set = await Set.get(setId)
      if (set.createdBy !== res.locals.user.username) throw new UnauthorizedError()
      return next()
    } catch (e) {
      return next(e)
    }
  }

  /** Middleware to use when set must be public OR user must own set they are trying to edit.
   * 
   * If not, raises Unauthorized
   */
  async function ensurePublicOrSetOwner(req, res, next){
    try {
      let publicOrOwner = false
      let setId = req.params.id 
      const set = await Set.get(setId)
      if (set.hidden === false) publicOrOwner = true
      if (set.createdBy === res.locals.user.username) publicOrOwner = true
      if (!publicOrOwner) throw new UnauthorizedError()
      return next()
    } catch (e) {
      return next(e)
    }
  }

  module.exports = {ensureSetOwner, ensurePublicOrSetOwner}