"use strict";

/** Flashcard routes */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const Flashcard = require("../models/flashcard");
const Comment = require("../models/comment");
const { ensureFlashcardOwner, ensurePublicOrFlashcardOwner, ensureCommentOwner} = require('../middleware/flashcards')
const { ensureLoggedIn } = require('../middleware/auth')

const updateFlashcardSchema = require("../schemas/updateFlashcardSchema.json");
const newFlashcardSchema = require("../schemas/newFlashcardSchema.json")
const commentSchema = require("../schemas/commentSchema.json")

const router = new express.Router();

/** GET /:id 
 *  Get information about a flashcard.
 *  =>  { flashcard: {id, sideOneName, sideTwoName, sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, setId} }
 * 
 *  Authorization required: Set must be public or user must be owner of set.
 */
router.get('/:id', ensurePublicOrFlashcardOwner, async function (req, res, next) {
    try {
        const id = +req.params.id
        const flashcard = await Flashcard.get(id)
        return res.send({flashcard})
    } catch (e){
        next(e)
    }
})

/** PATCH /:id 
 *  Data required: { sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl }
 *  Returns: { flashcard: {id, sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, setId} }
 * 
 * Authorization required: Must be owner of set flashcard belongs to.
 */
router.patch('/:id', ensureFlashcardOwner, async function(req, res, next) {
    try {
        const data = req.body
        const id = req.params.id
        const validator = jsonschema.validate(data, updateFlashcardSchema) 
        if (!validator.valid){
            throw new BadRequestError(validator.schema.messages.anyOf)
        } 
        const flashcard = await Flashcard.update(id, data)
        return res.status(201).json({flashcard})
    } catch (e) {
        next(e)
    }
})

/** POST /
 *  Data required: { sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, setId }
 *  Returns: { flashcard: {id, sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, setId} }
 * 
 * Authorization required: Must be owner of set flashcard belongs to.
 */
router.post('/', ensureFlashcardOwner, async function(req, res, next) {
    try {
        const data = req.body
        const validator = jsonschema.validate(data, newFlashcardSchema)
        if (!validator.valid){
            // how to get more user friendly errors here??
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const flashcard = await Flashcard.add(data)
        return res.status(201).json({flashcard})
    } catch (e) {
        next(e)
    }
})

/** DELETE /:id
 *  Data required: id
 *  Returns:  {deleted: id}
 * 
 *  Authorization required: Must be owner of set flashcard belongs to.
 */
router.delete('/:id', ensureFlashcardOwner, async function(req, res, next) {
    try {
        const id = +req.params.id
        const deleted = await Flashcard.delete(id)
        return res.status(200).json(deleted)
    } catch (e) {
        next(e)
    }
})

/** GET /:id/comments 
 *  => {comments: [{id, text, postedBy, datePosted, flashcardId, upvotes, downvotes}]}
 * 
 *  Authorization required: Set must be public or user must be owner of set.
*/
router.get('/:id/comments', ensureLoggedIn, ensurePublicOrFlashcardOwner, async function(req, res, next){
    try {
        const id = +req.params.id
        const comments = await Flashcard.getComments(id)
        return res.send({comments})
    } catch(e) {
        next(e)
    }
})
module.exports = router;

// add comment
/** POST /:id/comments
 *  Add a comment to a flashcard
 *  Data required: { text }
 *  Returns: {comment: { id, text, postedBy, datePosted, flashcardId, upvotes, downvotes }}
 */
router.post('/:id/comments', ensureLoggedIn, ensurePublicOrFlashcardOwner, async function(req, res, next){
    try {
        const id = +req.params.id
        const currentUser = res.locals.user
        //validate
        const validator = jsonschema.validate(req.body, commentSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const comment = await Comment.add({...req.body, postedBy: currentUser.username, flashcardId: id })
        res.status(201).send({comment})
    } catch(e) {
        next(e)
    }
})

/** PATCH /comments/:commentId
 *  Update a comment
 *  Data required: { text }
 *  Returns: {comment: { id, text, postedBy, datePosted, flashcardId, upvotes, downvotes }}
 */
router.patch('/comments/:commentId', ensureLoggedIn, ensureCommentOwner, async function(req, res, next){
    try {
        const commentId = +req.params.commentId
        //validate
        const validator = jsonschema.validate(req.body, commentSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const comment = await Comment.update(commentId, req.body.text)
        res.status(201).send({comment})
    } catch(e) {
        next(e)
    }
})

/** DELETE /comments/:commentId
 *  Delete a comment
 *  Data required: None
 *  Returns: {deleted: id}
 */
router.delete('/comments/:commentId', ensureLoggedIn, ensureCommentOwner, async function(req, res, next){
    try {
        const commentId = +req.params.commentId
        const deleted = await Comment.delete(commentId)
        res.send(deleted)
    } catch(e) {
        next(e)
    }
})

/** POST /comments/:commentId/upvote
 *  Upvote a comment.
 *  Data required: None
 *  Returns: { upvotes }
 */
router.post("/comments/:commentId/upvote", ensureLoggedIn, async function(req, res, next){
    try {
        const commentId =+req.params.commentId
        const upvotes = await Comment.upvote(commentId)
        res.send(upvotes)
    } catch(e) {
        next(e)
    }
})

/** POST /:id/comments/:commentId/downvote
 *  Downvote a comment.
 *  Data required: None
 *  Returns: { downvotes }
 */
router.post("/comments/:commentId/downvote", ensureLoggedIn, async function(req, res, next){
    try {
        const commentId =+req.params.commentId
        const downvotes = await Comment.downvote(commentId)
        res.send(downvotes)
    } catch(e) {
        next(e)
    }
})
