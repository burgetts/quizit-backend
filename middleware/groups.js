"use strict";

/** Convenience middleware to handle common auth cases in group routes. */

const { UnauthorizedError } = require("../expressError");
const Flashcard = require('../models/flashcard')
const User = require('../models/user')
const Group = require('../models/group')
const Post = require('../models/post')

/** Middleware to use when user must be a member of the group specified in the URL params.
 *  For group routes.
 * 
 *  If not, raises Unauthorized.
 */
async function ensureGroupMember(req, res, next){
    try {
        let isMember = false;

        const groupId = +req.params.id
        const currentUser = res.locals.user
        const currentUserGroups = await User.getGroups(currentUser.username)
        currentUserGroups.forEach(g => {
            if (g.id === groupId) isMember = true
        })
        if (!isMember) throw new UnauthorizedError()
        return next()
    } catch(e) {
        next(e)
    }
}

/** Middleware to use when user must be the owner of the group specified in the URL params.
 *  For group routes.
 * 
 *  If not, raises Unauthorized.
 */
async function ensureGroupOwner(req, res, next){
    try {
        let isOwner = false;

        const groupId = +req.params.id
        const currentUser = res.locals.user

        const group = await Group.get(groupId)
        if (group.createdBy === currentUser.username) isOwner = true
        
        if (!isOwner) throw new UnauthorizedError()
        return next()
    } catch(e) {
        next(e)
    }
}

/** Middleware to use when user must be the one who posted a post.
 *  For routes related to updating/deleting a group post.
 * 
 * If not, raises Unauthorized.
 */
async function ensureOriginalPoster(req, res, next){
    try {
        const postId = req.params.postId
        const post = await Post.get(postId)

        if (!(post.postedBy === res.locals.user.username)) throw new UnauthorizedError("You cannot edit a post you didn't write.")
        return next()
    } catch(e) {
        next(e)
    }
}

module.exports = {
    ensureGroupMember,
    ensureGroupOwner,
    ensureOriginalPoster
}