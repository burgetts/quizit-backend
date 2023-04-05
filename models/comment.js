"use strict";

const db = require("../db");
const { NotFoundError, BadRequestError } = require('../expressError')

class Comment {
    
    /** Get a comment by its id.
     *  Data required: id
     *  Returns: { id, text, postedBy, datePosted, flashcardId, upvotes, downvotes }
     * 
     *  Raises NotFoundError if no comment with that id is found.
     */
    static async get(id){
        const result = await db.query(`SELECT id, text, posted_by AS "postedBy", date_posted AS "datePosted", flashcard_id AS "flashcardId", upvotes, downvotes
                                       FROM flashcard_comments WHERE id = $1`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No comment with id ${id} found`)
        const comment = result.rows[0]
        return comment
        
    }


    /** Add a comment on a flashcard.
     *  Data required: {text, postedBy, flashcardId}
     *  Returns: { id, text, postedBy, datePosted, flashcardId, upvotes, downvotes }
     */
    static async add({text, postedBy, flashcardId}){
        const result = await db.query(`INSERT INTO flashcard_comments (text, posted_by, flashcard_id)
                                       VALUES ($1, $2, $3)
                                       RETURNING id, text, posted_by AS "postedBy", date_posted AS "datePosted", flashcard_id AS "flashcardId", upvotes, downvotes`, [text, postedBy, flashcardId])
        const comment = result.rows[0]
        return comment
    }

    /** Update a comment
     *  Data required: id, text
     *  Returns: { id, text, postedBy, datePosted, flashcardId, upvotes, downvotes }
     */
    static async update(id, text){
        const result = await db.query(`UPDATE flashcard_comments 
                                       SET text=$1
                                       WHERE id = $2
                                       RETURNING id, text, posted_by AS "postedBy", date_posted AS "datePosted", flashcard_id AS "flashcardId", upvotes, downvotes`, [text, id])
        if (result.rows.length === 0) throw new NotFoundError(`No comment with id ${id} found`)
        const comment = result.rows[0]
        return comment
    }
   
   /** Delete a comment.
    *  Data required: id
    *  Result: {deleted: id}
    */
    static async delete(id){
        const result = await db.query(`DELETE FROM flashcard_comments
                                        WHERE id = $1
                                        RETURNING id AS "deleted"`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No comment with id ${id} found`)
        const deleted = result.rows[0]
        return deleted
    }

    /** Add an upvote to a comment.
     *  Data required: id
     *  Returns: { upvotes }
     * 
     *  Raises NotFoundError if comment with that id cannot be found.
     */
    static async upvote(id){
        const result = await db.query(`UPDATE flashcard_comments
                                       SET upvotes=upvotes+1 
                                       WHERE id=$1
                                       RETURNING upvotes`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No comment with id ${id} found`)
        const upvotes = result.rows[0]
        return upvotes
    }

    /** Add a downvote to a comment.
     *  Data required: id
     *  Returns: { downvotes }
     * 
     *  Raises NotFoundError if comment with that id cannot be found.
     */
    static async downvote(id){
        const result = await db.query(`UPDATE flashcard_comments
                                       SET downvotes=downvotes+1 
                                       WHERE id=$1
                                       RETURNING downvotes`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No comment with id ${id} found`)
        const downvotes = result.rows[0]
        return downvotes
    }
}

module.exports = Comment;