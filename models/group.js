// "use strict";

const db = require("../db");
const { NotFoundError } = require('../expressError')

class Group {
    
    /** Retrieve all groups (all are public).
     *  Returns: [{ id, name, description, createdBy }, {...}]
     */
    static async getAll() {
        const result = await db.query(`SELECT id, name, description, created_by AS "createdBy"
                                       FROM groups`)
        const groups = result.rows
        return groups
    }

    /** Retrieve a group by its id.
     *  Data required: id
     *  Returns: { id, name, description, createdBy, dateCreated }
     */
    static async get(id){
        const result = await db.query(`SELECT id, name, description, created_by AS "createdBy", group_picture AS "groupPicture"
                                       FROM groups
                                       WHERE id=$1`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No group found with id ${id}`)
        const group = result.rows[0]
        return group
    }

    /** Retrieve all members of a group.
     *  Returns: [{username, firstName, profilePicture}, {...}]
     */
    static async getMembers(id){
        const result = await db.query(`SELECT u.username, u.first_name AS "firstName", u.profile_picture AS "profilePicture"
                                       FROM users AS u
                                       JOIN groups_members AS gm
                                       ON u.username=gm.member_username
                                       WHERE group_id=$1`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No group found with id ${id}`)
        const members = result.rows
        return members
    }

    /** Retrieve all sets belonging to group.
     *  Returns: [{id, hidden, name, description, created_by, date_created}, {...}] 
     */
    static async getSets(id){
        const result = await db.query(`SELECT s.id, s.name, s.description, s.side_one_name AS "sideOneName", side_two_name AS "sideTwoName", created_by AS "createdBy", TO_CHAR(date_created, 'Mon dd, yyyy') AS "dateCreated"
                                       FROM sets AS s
                                       JOIN groups_sets AS gs
                                       ON s.id=gs.set_id
                                       WHERE group_id=$1`, [id])
        const sets = result.rows
        return sets
    }
    
    /** Create a new group.
     *  Data required: { name, description, groupPicture, createdBy }
     *  Returns: { id, name, description, groupPicture, createdBy }
     */
    static async add({name, description, groupPicture, createdBy}){
        if (groupPicture === '') groupPicture = 'https://geodash.gov.bd/uploaded/people_group/default_group.png'
        const result = await db.query(`INSERT INTO groups (name, description, group_picture, created_by)
                                       VALUES ($1, $2, $3, $4)
                                       RETURNING id, name, description, group_picture AS "groupPicture", created_by AS "createdBy"`, [name, description, groupPicture, createdBy])
        const newGroup = result.rows[0]
        return newGroup
        // need to add to groups_members as well
    }

    /** Edit a group (only want owner to do this)
     *  Data required: { name, description, groupPicture }
     *  Returns: { id, name, description, groupPicture, createdBy }
     */
    static async update(id, {name, description, groupPicture}){
        const result = await db.query(`UPDATE groups
                                       SET name=$1, description=$2, group_picture=$3
                                       WHERE id=$4
                                       RETURNING id, name, description, group_picture AS "groupPicture", created_by AS "createdBy"`, [name, description, groupPicture, id])
        if (result.rows.length === 0) throw new NotFoundError(`No group found with id ${id}`)
        const updatedGroup = result.rows[0]
        return updatedGroup
    }

    
    /** Delete a group. (only owner can do this)
     *  Data required: id
     *  Returns: {deleted: id}
     */
    static async delete(id){
        const result = await db.query(`DELETE FROM groups
                                       WHERE id=$1
                                       RETURNING id AS "deleted"`, [id])
        if (result.rows.length === 0) throw new NotFoundError(`No group found with id ${id}`)
        const deleted = result.rows[0]
        return deleted
    }

    /** Create a group set. (any member can do this)
     *  Data required: groupId, {name, description, sideOneName, sideTwoName, createdBy }
     *  Returns: { id, name, description, sideOneName, sideTwoName, createdBy, dateCreated }
     */
    static async addSet(groupId, {name, description, sideOneName, sideTwoName, createdBy}){
        const result0 = await Group.get(groupId)

        const result = await db.query(`INSERT INTO sets
                                       (name, description, side_one_name, side_two_name, created_by)
                                       VALUES ($1, $2, $3, $4, $5)
                                       RETURNING id, name, description, side_one_name AS "sideOneName", side_two_name AS "sideTwoName", created_by AS "createdBy", TO_CHAR(date_created, 'Mon dd, yyyy') AS "dateCreated"`, [name, description, sideOneName, sideTwoName, createdBy])

        const newSet = result.rows[0]

        // have to associate set with group via groups_sets
        const result2 = await db.query(`INSERT INTO groups_sets (group_id, set_id)
                                        VALUES ($1, $2)`, [groupId, newSet.id])
        
        return newSet
    }

    /** Get all posts associated with a group.
     *  Data required: id
     *  Returns: [{id, text, postedBy, replyTo, upvotes, downvotes}]
     */
        static async getPosts(id){
            const result = await db.query(`SELECT id, text, posted_by AS "postedBy", TO_CHAR(date_posted, 'Mon dd, yyyy') AS "datePosted", reply_to AS "replyTo", upvotes, downvotes
                                           FROM group_posts
                                           WHERE group_id = $1 AND reply_to IS NULL
                                           ORDER BY id DESC`, [id])
            const posts = result.rows
            return posts
        }
}

module.exports = Group;