"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");

const { BCRYPT_WORK_FACTOR } = require("../config.js");
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../expressError')
const Group = require('../models/group')

class User {

  /** Get all users.
   *  Data required: None
   *  Returns { username, firstName, email , profilePicture, accountCreated }
   *
   **/
    static async getAll(){
        const result = await db.query(`SELECT username, first_name AS "firstName", email, profile_picture AS "profilePicture", TO_CHAR(account_created, 'Mon dd, yyyy') AS "accountCreated"
                                       FROM users `)
        const users = result.rows
        return users
    }

  /** Register user.
   *  Data required: { username, passwors, firstName, email }
   *  Returns { username, firstName, lastName, email }
   *
   *  Throws BadRequestError on duplicates.
   **/
  static async register({ username, password, firstName, email}) {
  const duplicateCheck = await db.query(
        `SELECT username
         FROM users
         WHERE username = $1`,
      [username],
  );

  if (duplicateCheck.rows[0]) {
    throw new BadRequestError(`Duplicate username: ${username}`);
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
  const result = await db.query(
        `INSERT INTO users
         (username,
          password,
          first_name,
          email)
         VALUES ($1, $2, $3, $4)
         RETURNING username, first_name AS "firstName", email`, [username, hashedPassword, firstName, email]);
  const user = result.rows[0];
  return user;
}

  /** Authenticate user.
   * Data required: { username, password }
   * Returns { username, first_name, email }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/
  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  email
           FROM users
           WHERE username = $1`, [username]);
    const user = result.rows[0];
    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }
    throw new UnauthorizedError("Invalid username/password");
  }

  /** Update user info.
   *  Data required: username, { firstName, email,  profilePicture }
   *  Returns: { firstName, email, username }
   * 
   *  Throws NotFoundError if no user is found.
   */
  static async update(username, data){
    let {firstName, email, profilePicture } = data
    const user = await db.query(`UPDATE users
                           SET first_name = $1, email = $2, profile_picture = $3
                           WHERE username = $4
                           RETURNING username, first_name AS "firstName", email`, [firstName, email, profilePicture, username])
    if (user.rows.length === 0) throw new NotFoundError(`No user with username ${username}`)
    return user.rows[0]
  }

  /** Get a list of all of a user's groups.
   *  Data required: username
   *  Returns groups: [{id, name, description}, {...}]
   */
  static async getGroups(username){
    let checkValidUser = await db.query(`SELECT username 
                                         FROM users
                                         WHERE username = $1`, [username])
    if (checkValidUser.rows.length === 0) throw new NotFoundError(`No user with username ${username}`)
    let result = await db.query(`SELECT g.id, g.name, g.description, g.group_picture AS "groupPicture"                                                                                                                                            
                                 FROM groups_members AS gm                                                                                                                                                                                   
                                 JOIN groups AS g                                                                                                                                                                                            
                                 ON gm.group_id = g.id                                                                                                                                                                                       
                                 WHERE gm.member_username = $1`, [username])
    const groups = result.rows
    return groups
  }

  /** Gets a list of all sets of flashcards created by a user.
   *  Data required: username
   * Returns sets: [{id, name, description, date_created}, {...}]
   */
  static async getSets(username){
    let checkValidUser = await db.query(`SELECT username 
                                         FROM users
                                         WHERE username = $1`, [username])
    if (checkValidUser.rows.length === 0) throw new NotFoundError(`No user with username ${username}`)
    let result = await db.query(`SELECT s.id, s.name, s.description,  TO_CHAR(s.date_created, 'Mon dd, yyyy') AS "dateCreated", s.hidden, s.created_by AS "createdBy" 
                                 FROM sets AS s                                                                                                                                                  
                                 JOIN users as u                                                                                                                                                                                             
                                 ON s.created_by=u.username WHERE username = $1`, [username])
    let sets = result.rows
    return sets
  }

  /** Get user.
   *  Data required: username
   *  Returns: { firstName, email, username, groups: [...], sets: [...] }
   *           Where groups is [{id, name, description}, {...}] 
   *           and sets is [{id, name, description, date_created}, {...}]
   * 
   *  Throws NotFoundError if no user is found.
   */
  static async get(username){
    let result = await db.query(`SELECT username, first_name AS "firstName", email, profile_picture AS "profilePicture", TO_CHAR(account_created, 'Mon dd, yyyy') AS "accountCreated"
                         FROM users
                         WHERE username = $1`, [username])
    if (result.rows.length === 0) throw new NotFoundError(`No user with username ${username}`)
    let user = result.rows[0]
    let groups = await User.getGroups(username)
    user.groups = groups

    let sets = await User.getSets(username)
    user.sets = sets
    return user
  }

  /** Join a group.
   *  Data required: username, groupId
   *  Returns: groupId
   * 
   *  Throws not found error if group or user does not exist.
   */
  static async joinGroup(username, groupId){
    // verify that user and group both exist
    let checkValidUser = await db.query(`SELECT username 
                                         FROM users
                                         WHERE username = $1`, [username])
    if (checkValidUser.rows.length === 0) throw new NotFoundError(`No user with username ${username}`)

    let checkValidGroup = await db.query(`SELECT id
                                          FROM groups
                                          WHERE id = $1`, [groupId])
    if (checkValidGroup.rows.length === 0) throw new NotFoundError(`No group with id ${groupId}`)
    
    // add entry to groups_members
    let result = await db.query(`INSERT INTO groups_members
                                 (member_username, group_id)
                                 VALUES
                                 ($1, $2)
                                 RETURNING group_id AS "joined"`, [username, groupId])
    return result.rows[0]
  }


 /** Leave a group.
  *  Data required: username, groupId
  *  Returns: {removed: group_id}
  *  The owner of the group cannot leave the group.
  */
  static async leaveGroup(username, groupId){
    // check if owner
    let group = await Group.get(groupId)
   
    if (group.createdBy === username) throw new BadRequestError("You can't leave a group if you own it!")

    // check if user is in group and remove them if so
    let result2 = await db.query(`DELETE FROM groups_members WHERE group_id=$1 AND member_username=$2
                                 RETURNING group_id as "removed"`, [groupId, username])
    if (result2.rows.length === 0) throw new NotFoundError(`No user with username ${username} in group ${groupId}`)
    return result2.rows[0]
  }
}

module.exports = User;

