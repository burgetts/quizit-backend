"use strict";

/** User routes */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const {ensureCurrentUser, ensureLoggedIn} = require('../middleware/auth')
const updateUserSchema = require("../schemas/updateUserSchema.json");

const router = express.Router();

/** GET /
 *  Get all users.
 *  => {username, firstName, email, profilePicture, accountCreated}
 * 
 *  Authorization required: Must be logged in
 */
router.get('/', ensureLoggedIn, async function (req, res, next){
    try {
        const users = await User.getAll()
        return res.send({users})
    } catch(e) {
        next(e)
    }
})

/** GET /:username
 *  Get a user's info. Will not return email if not current user.
 *  => {username, firstName, email, groups, sets}
 * 
 *  Authorization required: Must be logged in
 */
router.get('/:username', async function (req, res, next){
    try {
        console.log('now in backend GET/:username route')
        const username = req.params.username
        console.log('getting User from database')
        const user = await User.get(username)
        console.log('user retrieved from database', user)
        if (res.locals.user.username !== user.username) delete user.email
        return res.send({user})
    } catch(e) {
        next(e)
    }
})

/** PATCH /:username
 *  Update a user.
 *  Data required: {username, email, firstName, profilePicture}
 *  Returns {user: {firstName, email, username}}
 * 
 *  Authorization: Must be logged in as user in URL params
 */
router.patch('/:username', ensureCurrentUser, async function (req, res, next){
    try {
        const username = req.params.username
        const data = req.body
        const validator = jsonschema.validate(data, updateUserSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const user = await User.update(username, data)
        return res.status(201).json({user}) //REMOVED BRACKETS FROM USER IN THIS LINE
    } catch (e) {
        next(e)
    }
})

/** GET /:username/sets
 *  Get a user's flaschard sets. Will only return public sets if not logged in user.
 *  Data required: username
 *  Returns: {sets: [{id, name, description, date_created}, {...}]}
 * 
 *  Authorization: Must be logged in.
 */
router.get('/:username/sets', ensureLoggedIn, async function (req, res, next){
    try {
        const username = req.params.username
        const sets = await User.getSets(username)
        if (res.locals.user.username !== username){
            const publicSetsOnly = sets.filter(s => s.hidden === false)
            return res.send({sets: publicSetsOnly})
        }
        return res.send({sets})
    } catch(e) {
        next(e)
    }
})

/** GET /groups
 *  Get a list of groups a user belongs to.
 *  Data required: username
 *  Returns: {groups: [{id, name, description}, {...}]}
 * 
 *  Authorization: Must be logged in
 */
router.get('/:username/groups', ensureLoggedIn, async function (req, res, next){
    try {
        const username = req.params.username
        const groups = await User.getGroups(username)
        return res.send({groups})
    } catch(e) {
        next(e)
    }
})

/** POST /:username/groups/:id
 *  Join a group.
 *  Data required: username, groupId
 *  Returns: {joined: groupId}
 * 
 *  Authorization: Must be logged in as user in URL params
 */
router.post('/:username/groups/:id', ensureCurrentUser, async function (req, res, next){
    try {
        const {username, id} = req.params
        const joined = await User.joinGroup(username, id)
        return res.send(joined)
    } catch (e) {
        next(e)
    }
})

/** DELETE /:username/groups/:id
 *  Remove user from a group.
 *  Data required: None
 *  Returns: {deleted: groupId}
 * 
 *  Authorization: Must be logged in as user in URL params
 */
router.delete('/:username/groups/:id', ensureCurrentUser, async function (req, res, next){
    try {
        const {username, id} = req.params
        const removed = await User.leaveGroup(username, id)
        return res.send(removed)
    } catch(e) {
        next(e)
    }
})
module.exports = router;