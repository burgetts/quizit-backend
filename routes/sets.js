"use strict";

/** Set routes */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth")
const { ensureSetOwner, ensurePublicOrSetOwner } = require("../middleware/sets")
const Set = require("../models/set");
const User = require("../models/user")

const updateSetSchema = require("../schemas/updateSetSchema.json");
const newSetSchema = require("../schemas/newSetSchema.json")

const router = new express.Router();

/** GET /
 *  Get all public sets.
 *  =>  { sets: [{id, hidden, name, description, created_by, date_created}, {...}] }
 * 
 *  Authorization required: Must be logged in.
 */
router.get('/', ensureLoggedIn, async function (req, res, next){
    try {
        const sets = await Set.getPublicSets()
        return res.send({sets})
     } catch (e) {
        next(e)
     }
})

/** GET /:id
 *  => {set: id, name, hidden, description, created_by, date_created, flashcards: [...]}
 *     Where flashcards is {id, sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl}
 * 
 *  Authorization required: Set must be public or current user must own set.
 */
router.get('/:id', ensurePublicOrSetOwner, async function (req, res, next){
    try {
        const id = req.params.id
        const set = await Set.get(id)
        return res.send({set})
    } catch (e) {
        next(e)
    }
})

/** PATCH /:id
 *  Data required: {name, description, sideOneName, sideTwoName}
 *  Returns: {set: {id, name, description, sideOneName, sideTwoName, createdBy, dateCreated}}
 *  
 *  Authorization required: User must own set.
 */
router.patch('/:id', ensureSetOwner, async function (req, res, next){
    try {
        const id = req.params.id
        const validator = jsonschema.validate(req.body, updateSetSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        const set = await Set.update(id, req.body)
        return res.status(201).json({set})
    } catch (e) {
        next(e)
    }
})

/** POST / - Create a set
 *  Data required: { hidden, name, description,  sideOneName, sideTwoName }
 *  Returns: {set: { id, hidden, name, description, createdBy, dateCreated, sideOneName, sideTwoName }}
 *  
 *  Authorization required: Must be logged in
 */
router.post('/', ensureLoggedIn, async function (req, res, next){
    try {
        const validator = jsonschema.validate(req.body, newSetSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        // get user username for createdBy
        const currentUser = res.locals.user
        const set = await Set.add({...req.body, createdBy: currentUser.username})
        return res.status(201).json({set})
    } catch (e) {
        next(e)
    }
})

/** DELETE /:id - Delete a set
 *  Data required: id
 *  Returns: { deleted: id }
 * 
 *  Authorization: Must own set
 */
router.delete('/:id', ensureSetOwner, async function (req, res, next){
    try {
        const id = req.params.id
        const deleted= await Set.delete(id)
        return res.status(200).json({deleted})
    } catch (e) {
        next(e)
    }
})

module.exports = router;