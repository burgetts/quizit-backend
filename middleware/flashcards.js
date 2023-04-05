"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const { UnauthorizedError } = require("../expressError");
const Flashcard = require('../models/flashcard')
const User = require('../models/user')
const Set = require('../models/set')
const Comment = require('../models/comment')

/** Middleware to use when user must be owner of flashcard set they are trying to edit/delete.
 *  For flashcard routes.
 * 
 *  If not, raises Unauthorized.
 */
async function ensureFlashcardOwner(req, res, next){
    try {
      let owner = false
      let setId = req.body.setId
      // if setId not in request body, get it from the flashcard
      if (!setId){
        const flashcard = await Flashcard.get(req.params.id)
        setId = flashcard.setId
      }
      // check if current user has that setId in their sets
      const currentUser = res.locals.user
      const user = await User.get(currentUser.username)
      user.sets.forEach(s => {
        if (s.id === setId){
          owner = true
        } 
      })
      if (!owner) throw new UnauthorizedError()
      return next()
    } catch (e) {
      return next(e)
    }
  }
  
  /** Middleware ot user when set must be publir or user must be owner of set.
   * 
   *  If not, raises Unauthorized.
   */
  async function ensurePublicOrFlashcardOwner(req, res, next){
    try {
      let owner = false
      let setId = req.body.setId
      // if setId not in request body, get it from the flashcard
      if (!setId){
        const flashcard = await Flashcard.get(req.params.id)
        setId = flashcard.setId
      }
      // check if set is public
      const set = await Set.get(setId)
      if (set.hidden === false) owner = true
      // check if current user has that setId in their sets
      const currentUser = res.locals.user
      const user = await User.get(currentUser.username)
      user.sets.forEach(s => {
        if (s.id === setId){
          owner = true
        } 
      })
      if (!owner) throw new UnauthorizedError()
      return next()
    } catch (e) {
      return next(e)
    }
  }

  async function ensureCommentOwner(req, res, next){
    try {
        const comment = await Comment.get(req.params.commentId)
        if (!(comment.postedBy === res.locals.user.username)) throw new UnauthorizedError(`You can't edit a comment you didn't make.`)
        return next()
    } catch(e) {
       return next(e)
    }
  }

  module.exports = {ensureFlashcardOwner, ensurePublicOrFlashcardOwner, ensureCommentOwner}