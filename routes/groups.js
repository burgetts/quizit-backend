"use strict";

/** Group routes */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth")
const Group = require('../models/group')
const Flashcard = require("../models/flashcard")
const Post = require("../models/post")
const User = require('../models/user')

const newGroupSchema = require("../schemas/newGroupSchema.json");
const updateGroupSchema = require("../schemas/updateGroupSchema.json")
const newSetSchema = require("../schemas/newGroupSetSchema.json")
const newGroupFlashcardSchema = require("../schemas/newGroupFlashcardSchema.json")
const updateFlashcardSchema = require("../schemas/updateFlashcardSchema.json")
const newPostSchema = require("../schemas/newPostSchema.json")

const { ensureGroupOwner, ensureGroupMember, ensureOriginalPoster} = require('../middleware/groups')

const router = new express.Router();


/** GET /
 *  Get all groups.
 * => {groups: { id, name, description, createdBy }, {...} }
 *
 *  Authorization needed: Must be logged in
 */
router.get('/', ensureLoggedIn, async function (req, res, next){
    try {
        const groups = await Group.getAll()
        return res.send({groups})
    } catch (e) {
            next(e)
    }
})


/** GET /:id
 *  Get a group by its id.
 * => {group: { id, name, description, createdBy, groupPicture } }
 *
 *  Authorization needed: Must be logged in
 */
router.get('/:id',  ensureLoggedIn, async function (req, res, next){
    try {
        const id = +req.params.id
        const group = await Group.get(id)
        return res.send({group})
    } catch (e) {
        next(e)
    }
})

/** GET /:id/members
 *  Gets all members of a group.
 *  => {members: [{ username, firstName, profilePicture }, {...}]}
 * 
 *  Authorization needed: Must be logged in
 */
router.get('/:id/members', ensureLoggedIn, async function (req, res, next){
    try {
        const groupId = req.params.id
        const members = await Group.getMembers(groupId)
        return res.send({members})
    } catch(e) {
        next(e)
    }
})

/** GET /:id/sets
 *  Gets all sets belonging to a group.
 *  => {sets: [{id, name, description, created_by, date_created}, {...}] }
 * 
 *  Authorization needed: Must be in group
 */
router.get('/:id/sets', ensureLoggedIn, ensureGroupMember, async function (req, res, next){
    try {
        const groupId = req.params.id
        const sets = await Group.getSets(groupId)
        return res.send({sets})
    } catch(e) {
        next(e)
    }
})

/** POST /
 *  Create a new group.
 *  Data required: { name, description, groupPicture }
 *  Returns: { id, name, description, groupPicture, createdBy }
 * 
 *  Authorization required: Must be logged in.
 */
router.post('/', ensureLoggedIn, async function (req, res, next){
    try {
        const validator = jsonschema.validate(req.body, newGroupSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const currentUser = res.locals.user
        const group = await Group.add({...req.body, createdBy: currentUser.username})
        // must add association using groups_members
        await User.joinGroup(currentUser.username, group.id)
        return res.status(201).json({group})
    } catch (e) {
        next(e)
    }
})

/** PATCH /:id
 *  Update an existing group.
 *  Data required: { name, description, groupPicture }
 *  Returns: { id, name, description, groupPicture, createdBy }
 * 
 *  Authorization required: Must be owner of group
 */
router.patch('/:id', ensureLoggedIn, ensureGroupOwner, async function(req, res, next){
    try {
        const id = req.params.id
        const validator = jsonschema.validate(req.body, updateGroupSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const group = await Group.update(id, req.body)
        return res.status(201).json({group})
    } catch(e) {
        next(e)
    }
})

/** DELETE /:id
 *  Delete a group.
 *  Data required: id
 *  Returns: { deleted: id }
 * 
 *  Authorization: Must be owner of group
 */
router.delete('/:id', ensureLoggedIn, ensureGroupOwner, async function(req, res, next){
    try {
        const id = req.params.id
        const deleted = await Group.delete(id)
        return res.send(deleted)
    } catch(e) {
        next(e)
    }
})

/** POST /groups/:id/sets
 *  Add a set to a group
 *  Data required: { name, description, side_one_name, side_two_name }
 *  Returns: {set: { id, name, description, sideOneName, sideTwoName, createdBy, dateCreated }}
 * 
 *  Authorization required: Must be in group
 */
router.post('/:id/sets', ensureLoggedIn, ensureGroupMember, async function (req, res, next){
    try {
        const groupId = +req.params.id
        const currentUser = res.locals.user
        const validator = jsonschema.validate(req.body, newSetSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const set = await Group.addSet(groupId, {...req.body, createdBy: currentUser.username})
        return res.status(201).json({set})
    } catch(e) {
        next(e)
    }
})

/** POST /:id/sets/:setId/flashcards
 *  Add a flashcard to a group set. This is in its own route because it requires different middleware than the flashcard route.
 *  id is group id.
 *  Data required: { sideOneText (optional), sideTwoText (optional), sideOneImageUrl(optional), sideTwoImageUrl(optional), setId }
 *  Returns: { flashcard: {id, sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, setId} }
 *  Must enter either text or image url (or both) for each side of the flashcard.
 * 
 *  Authorization required: Must be in group
 */
router.post('/:id/sets/:setId/flashcards', ensureLoggedIn, ensureGroupMember, async function(req, res, next){
    try {
        const setId = +req.params.setId
        const validator = jsonschema.validate(req.body, newGroupFlashcardSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const flashcard = await Flashcard.add({setId: setId, ...req.body })
        return res.status(201).json({flashcard})
    } catch (e){
        next(e)
    }
})

/** PATCH /flashcards/:flashcardId
 *  Update a flashcard that's part of a group set.
 *  Data required: { sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, setId }
 *  Returns: { id,  sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, setId }
 * 
 *  Authorization required: Must be in group
 */
router.patch('/:id/flashcards/:flashcardId', ensureLoggedIn, ensureGroupMember, async function(req, res, next){
    try {
        const flashcardId = req.params.flashcardId
        const validator = jsonschema.validate(req.body, updateFlashcardSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const flashcard = await Flashcard.update(flashcardId, req.body)
        return res.status(201).json({flashcard})
    } catch (e){
        next(e)
    }
})

/** DELETE /:id/flashcards/:id
 *  Delete a flashcard that's part of a group set.
 *  Data required: id
 *  Returns: {deleted: id}
 *  
 *  Authorization required: Must be in group
 */
router.delete('/:id/flashcards/:flashcardId', ensureLoggedIn, ensureGroupMember, async function(req, res, next){
    try {
        const flashcardId = +req.params.flashcardId
        const deleted = await Flashcard.delete(flashcardId)
        return res.send(deleted)
    } catch (e){
        next(e)
    }
})

/** GET /:id/posts
 *  Get all group posts.
 *  => { posts: [{id, text, postedBy, replyTo, upvotes, downvotes}] }
 * 
 *  Authorization required: Must be in group
 */
router.get("/:id/posts", ensureLoggedIn, ensureGroupMember,  async function(req, res, next){
    try {
        const id = req.params.id
        const posts = await Group.getPosts(id)
        return res.send({posts})
    } catch(e) {
        next(e)
    }
})


/** POST /:id/posts/:postId/reply
 *  Add a reply.
 *  Data required: { text }
 *  Returns: { id, text, postedBy, datePosted, replyTo, upvotes, downvotes, groupId }
 * 
 *  Authorization needed: Must be in group.
*/
router.post('/:id/posts/:postId/reply', ensureLoggedIn, ensureGroupMember,  async function(req, res, next){
    try {
        const groupId = req.params.id
        const postId = req.params.postId
        const postedBy = res.locals.user.username
        const validator = jsonschema.validate(req.body, newPostSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const reply = await Post.add({...req.body, replyTo: postId, groupId: groupId, postedBy: postedBy})
        return res.status(201).send({reply})
    } catch(e) {
        next(e)
    }
})

/** POST /:id/posts
 *  Add a post.
 *  Data required: { text }
 *  Returns: { id, text, postedBy, datePosted, replyTo, upvotes, downvotes, groupId }
 * 
 *  Authorization needed: Must be in group.
*/
router.post('/:id/posts', ensureLoggedIn, ensureGroupMember, async function(req, res, next){
    try {
        const groupId = req.params.id
        const postedBy = res.locals.user.username
        const validator = jsonschema.validate(req.body, newPostSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const post = await Post.add({...req.body, groupId: groupId, postedBy: postedBy})
        return res.status(201).send({post})
    } catch(e) {
        next(e)
    }
})

// post model routes
/** GET /:id/posts/:postId/replies
 *  Get all groups.
 * => {groups: { id, name, description, createdBy }, {...} }
 *
 *  Authorization needed: Must be in group.
 */
router.get('/:id/posts/:postId/replies', ensureLoggedIn, ensureGroupMember, async function(req, res, next){
    try {
        const postId = req.params.postId
        const replies = await Post.getReplies(postId)
        return res.send({replies})
    } catch(e) {
        next(e)
    }
})

/** PATCH /:id/posts/:postId 
 *  Update a post.
 *  Data required: { text }
 *  Returns: {post: { id, name, description, groupPicture, createdBy }}
 *  
 *  Authorization needed: Must be the user that created the post.
*/
router.patch('/:id/posts/:postId', ensureLoggedIn, ensureOriginalPoster, async function(req, res, next){
    try {
        const postId = req.params.postId
        const validator = jsonschema.validate(req.body, newPostSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const post = await Post.update(postId, req.body.text)
        return res.status(201).send({post})
    } catch(e) {
        next(e)
    }
})

/** DELETE /:id/posts/:postId
 *  Delete a post
 *  Data required: id
 *  Returns: {deleted: id}
 * 
 *  Authorization required: Must be the user that created the post.
*/
router.delete('/:id/posts/:postId', ensureLoggedIn, ensureOriginalPoster, async function(req, res, next){
    try {
        const postId = req.params.postId
        const deleted = await Post.delete(postId)
        return res.send(deleted)
    } catch(e) {
        next(e)
    }
})

/** POST /:id/posts/:postId/upvote
 *  Upvote a post.
 *  Data required: None
 *  Returns: {upvoted: id}
 * 
 *  Authorization required: Must be group member.
 */
router.post('/:id/posts/:postId/upvote', ensureLoggedIn, ensureGroupMember, async function(req, res, next){
    try {
        const postId = req.params.postId
        const upvoted = await Post.upvote(postId)
        return res.status(201).send(upvoted)
    } catch(e) {
        next(e)
    }
})

/** POST /:id/posts/:postId/downvote
 *  Downvote a post.
 *  Data required: None
 *  Returns: {downvoted: id}
 * 
 *  Authorization required: Must be group member.
 */
router.post('/:id/posts/:postId/downvote', ensureLoggedIn, ensureGroupMember, async function(req, res, next){
    try {
        const postId = req.params.postId
        const downvoted = await Post.downvote(postId)
        return res.status(201).send(downvoted)
    } catch(e) {
        next(e)
    }
})

// comment routes


module.exports = router;