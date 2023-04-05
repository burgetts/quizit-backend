// "use strict";

const db = require("../db");
const { NotFoundError } = require('../expressError')

class Flashcard {

    /** Retrieve a flashcard from the database by its id.
     *  Data should be: id
     *  Returns: { sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, setId }
     * 
     *  Throws error if a flashcard with that id is not found.
     */
    static async get(id) {
        const result = await db.query(`SELECT id, side_one_text AS "sideOneText", side_two_text AS "sideTwoText", side_one_image_url AS "sideOneImageUrl", side_two_image_url AS "sideTwoImageUrl", set_id AS "setId"
                                       FROM flashcards WHERE id = $1`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`Flashcard with id ${id} not found`)
        const flashcard = result.rows[0]
        return flashcard
    }

    /** Create a new flashcard
     *  Data should be: { sideOneText (optional), sideTwoText (optional), sideOneImageUrl(optional), sideTwoImageUrl(optional), setId}
     *  Returns: {id,  sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, setId }
     * 
     *  Must enter either text or image url (or both) for each side of the flashcard.
     */
    static async add({sideOneText='', sideTwoText='', sideOneImageUrl='', sideTwoImageUrl='', setId}) {
        const result = await db.query(`INSERT INTO flashcards
                                 (side_one_text, side_two_text, side_one_image_url, side_two_image_url, set_id)
                                 VALUES ($1, $2, $3, $4, $5)
                                 RETURNING id, side_one_text AS "sideOneText", side_two_text AS "sideTwoText", side_one_image_url AS "sideOneImageUrl", side_two_image_url AS "sideTwoImageUrl", set_id AS "setId"`, [sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, setId])
        const flashcard = result.rows[0]
        return flashcard
    }
    
    /** Update an existing flashcard
     *  Data should be: { id, sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl }
     *  Returns: { id, sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, setId }
     * 
     *  Throws error if a flashcard with that id is not found.
     */
    static async update(id, {sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl}) {
        const result = await db.query(`UPDATE flashcards
                                 SET side_one_text = $1, side_two_text = $2, side_one_image_url = $3, side_two_image_url = $4
                                 WHERE id = $5
                                 RETURNING id, side_one_text AS "sideOneText", side_two_text AS "sideTwoText", side_one_image_url AS "sideOneImageUrl", side_two_image_url AS "sideTwoImageUrl", set_id AS "setId"`, [sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl, id]) 
        if (!result.rows[0]) throw new NotFoundError(`Flashcard with id ${id} not found`)
        const flashcard = result.rows[0]
        return flashcard
    }

    /** Delete a flashcard.
     *  Data should be: id 
     *  Returns: deletedId 
     * 
     *  Throws error if a flashcard with that id is not found.
     */
    static async delete(id) {
        const result = await db.query(`DELETE FROM flashcards
                                 WHERE id = $1
                                 RETURNING id AS "deleted"`, [id])
        if (!result.rows[0]) throw new NotFoundError(`Flashcard with id ${id} not found`)
        const deletedId = result.rows[0]
        return deletedId
    }

    /** Get all comments on a flashcard.
     *  Data should be: id
     *  Returns: [{id, text, postedBy, datePosted, flashcardId, upvotes, downvotes}, {...}]
     */
    static async getComments(id){
        const result = await db.query(`SELECT id, text, posted_by AS "postedBy", date_posted AS "datePosted", flashcard_id AS "flashcardId", upvotes, downvotes
                                        FROM flashcard_comments WHERE flashcard_id=$1`, [id])          
        const comments = result.rows 
        return comments
    }
}

module.exports = Flashcard;