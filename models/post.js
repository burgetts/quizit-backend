"use strict";

const db = require("../db");

const { NotFoundError } = require("../expressError")
class Post{

    /** Get replies to a post (all replies are posts themselves)
     *  Data required: id
     *  Returns: [{id, text, postedBy, replyTo, upvotes, downvotes}]
    */
    static async getReplies(id){
        const result = await db.query(`SELECT id, text, posted_by AS "postedBy", TO_CHAR(date_posted, 'Mon dd, yyyy') AS "datePosted", reply_to AS "replyTo", upvotes, downvotes
                                       FROM group_posts
                                       WHERE reply_to=$1`, [id])
        const replies = result.rows
        return replies
    }

    /** Get a post by its id.
     *  Data required: id
     *  Returns: {id, text, postedBy, replyTo, upvotes, downvotes}
     */
    static async get(id){
        const result = await db.query(`SELECT id, text, posted_by AS "postedBy", TO_CHAR(date_posted, 'Mon dd, yyyy') AS "datePosted", reply_to AS "replyTo", upvotes, downvotes
                                        FROM group_posts
                                        WHERE id=$1`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No post with id ${id} found.`)
        const post = result.rows[0]
        return post
    }

    /** Edit a post
     *  Data required: id, text
     *  Returns: {id, text, postedBy, replyTo, upvotes, downvotes}
     */
    static async update(id, text){
        const result = await db.query(`UPDATE group_posts
                                       SET text=$1
                                       WHERE id = $2
                                       RETURNING id, text, posted_by AS "postedBy", TO_CHAR(date_posted, 'Mon dd, yyyy') AS "datePosted", reply_to AS "replyTo", upvotes, downvotes, group_id AS "groupId"`, [text, id])
        if (result.rows.length === 0) throw new NotFoundError(`No post with id ${id} found`)
        const post = result.rows[0]
        return post
    }

    /** Add a post. replyTo is optional - only use if this post is a reply to another post.
     *  Data required: {text, postedBy, replyTo (optional)}
     *  Returns: { id, text, postedBy, datePosted, replyTo, upvotes, downvotes, groupId }
     */
    static async add({text, postedBy, replyTo=null, groupId}){
        const result = await db.query(`INSERT INTO group_posts (text, posted_by, reply_to, group_id)
                                        VALUES ($1, $2, $3, $4)
                                        RETURNING id, text, posted_by AS "postedBy", TO_CHAR(date_posted, 'Mon dd, yyyy') AS "datePosted", reply_to AS "replyTo", upvotes, downvotes, group_id AS "groupId"`, [text, postedBy, replyTo, groupId])
        const post = result.rows[0]
        return post
    }

    /** Delete a post. 
     *  Data required: id
     *  Returns: {deleted: id}
     */
    static async delete(id){
        const result = await db.query(`DELETE FROM group_posts
                                       WHERE id=$1
                                       RETURNING id AS "deleted"`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No post with id ${id} found`)
        const deleted = result.rows[0]
        return deleted
    }

    /** Upvote a post.
     *  Data required: id
     *  Returns: upvotes
     */
    static async upvote(id){
        const result = await db.query(`UPDATE group_posts
                                       SET upvotes=upvotes+1
                                       WHERE id=$1
                                       RETURNING upvotes`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No post with id ${id} found`)
        const upvotes = result.rows[0]
        return upvotes
    }

    /** Downvote a post.
     *  Data required: id
     *  Returns: downvotes
     */
    static async downvote(id){
        const result = await db.query(`UPDATE group_posts
                                       SET downvotes=downvotes+1
                                       WHERE id=$1
                                       RETURNING downvotes`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No post with id ${id} found`)
        const downvotes = result.rows[0]
        return downvotes
    }
}

module.exports = Post;