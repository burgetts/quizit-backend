"use strict";

const db = require("../db");

const {NotFoundError} = require('../expressError')

class Set {

    /** Retrieve all public sets.
     *  Returns: [{ id, hidden, name, description, createdBy, dateCreated, numFlashcards }, {...}]
     */
    static async getPublicSets(){
        const result = await db.query(`SELECT s.id, s.name, s.description, s.created_by AS "createdBy", TO_CHAR(date_created, 'Mon dd, yyyy') AS "dateCreated", COUNT(f.id) AS "numFlashcards" 
                                       FROM sets AS s 
                                       FULL OUTER JOIN flashcards as f 
                                       ON s.id = f.set_id                                                                                                                                                                                          
                                       WHERE s.hidden=false                                                                                                                                                                                        
                                       GROUP BY s.id;`)
        const sets = result.rows
        return sets
    }

    /** Retrieves set from the database by its id.
     *  Data should be: id
     *  Returns: {id, hidden, name, description, createdBy, dateCreated, sideOneName, sideTwoName, flashcards: [{...}, {...}, ...]}
     *  Flashcards are: {sideOneText, sideTwoText, sideOneImageUrl, sideTwoImageUrl}
     * 
     * Throws error if a set with that id is not found.
     */
    static async get(id){
        const result = await db.query(`SELECT id, hidden, name, description, created_by AS "createdBy",  TO_CHAR(date_created, 'Mon dd, yyyy') AS "dateCreated", side_one_name AS "sideOneName", side_two_name AS "sideTwoName"
                                       FROM sets 
                                       WHERE id = $1`, [id])
                                 
        if (result.rows.length === 0) throw new NotFoundError(`Set with id ${id} not found.`)
        const set = result.rows[0]

        const result2 = await db.query(`SELECT id, side_one_text AS "sideOneText", side_two_text AS "sideTwoText", side_one_image_url AS "sideOneImageUrl", side_two_image_url AS "sideTwoImageUrl"
                                        FROM flashcards
                                        WHERE set_id = $1`, [id])
        const flashcards = result2.rows
        set.flashcards = flashcards
        return set
    }

    /** Create a new set.
     *  Data should be: { hidden, name, description, createdBy, sideOneName, sideTwoName }
     *  Returns: { id, hidden, name, description, createdBy, dateCreated, sideOneName, sideTwoName }
     */
    static async add({hidden, name, description, createdBy, sideOneName, sideTwoName}){
        const result = await db.query(`INSERT INTO sets
                                       (hidden, name, description, side_one_name, side_two_name, created_by)
                                       VALUES
                                       ($1, $2, $3, $4, $5, $6)
                                       RETURNING id, hidden, name, description, created_by AS "createdBy", date_created AS "dateCreated", side_one_name AS "sideOneName", side_two_name AS "sideTwoName"`, [hidden, name, description, sideOneName, sideTwoName, createdBy])
        const set = result.rows[0]
        return set
    }

    /** Delete a set.
     *  Data should be: id
     *  Returns: {deleted: id}
     */
    static async delete(id){
        const result = await db.query(`DELETE FROM sets
                                       WHERE id = $1
                                       RETURNING id AS "deleted"`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No set with id ${id} found`)
        const deletedId = result.rows[0]
        return deletedId
    }
   
    /** Update a set
     *  Data should be: { name, description, sideOneName, sideTwoName }
     *  Returns: { id, name, description, sideOneName, sideTwoName, createdBy, dateCreated }
     * 
     *  Throws error if a flashcard with that id is not found.
     */
    static async update(id, {name, description, sideOneName, sideTwoName}){
        const result = await db.query(`UPDATE sets
                                       SET name = $1, description = $2, side_one_name = $3, side_two_name = $4
                                       WHERE id = $5
                                       RETURNING id, name, description, side_one_name AS "sideOneName", side_two_name AS "sideTwoName", created_by AS "createdBy", date_created AS "dateCreated"`, [name, description, sideOneName, sideTwoName, id])
        if (result.rows.length === 0) throw new NotFoundError(`Set with id ${id} not found`)
        const set = result.rows[0]
        return set
    }
}

module.exports = Set;