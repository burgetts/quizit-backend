"use strict";

const db = require("../db.js");
const { createToken } = require("../helpers/token");
const bcrypt = require('bcrypt')
const {BCRYPT_WORK_FACTOR} = require('../config')


async function commonBeforeAll() {
    
    // delete from all tables
    await db.query("DELETE FROM users");
    await db.query("DELETE FROM sets");
    await db.query("DELETE FROM flashcards")
    await db.query("DELETE FROM groups")
    await db.query("DELETE FROM groups_members")
    await db.query("DELETE FROM groups_sets")
    await db.query("DELETE FROM group_posts")
    await db.query("DELETE FROM flashcard_comments")

   // seed data
    // two users - u1 and u2
    const result0 = await db.query(`INSERT INTO users (username, password, first_name, email)
                    VALUES ('u1', $1, 'User1', 'u1@email.com'),
                           ('u2', $2, 'User2', 'u2@email.com'),
                           ('u3', $3, 'User3', 'u3@email.com')
                    RETURNING username`, [await bcrypt.hash("password1", BCRYPT_WORK_FACTOR), await bcrypt.hash("password2", BCRYPT_WORK_FACTOR), await bcrypt.hash("password3", BCRYPT_WORK_FACTOR)]);
    let userIds = result0.rows
    
    // u1 has 1 public set and 1 private set, u2 has 1 public set
    const result1 = await db.query(`INSERT INTO sets (name, description, side_one_name, side_two_name, created_by, hidden)
                    VALUES ('Set1', 'Test set 1', 'Term', 'Definition', 'u1', false),
                           ('Set2', 'Test set 2', 'Term', 'Definition', 'u1', true),
                           ('Set3', 'Test set 3', 'Term', 'Definition', 'u2', false),
                           ('GroupSet1', 'Group set 1', 'Term', 'Definition', 'u1', false)
                    RETURNING id`)
    let setIds = result1.rows
   
    // add 1 flashcard to each set
    const result5 = await db.query(`INSERT INTO flashcards (side_one_text, side_two_text, set_id)
                    VALUES ('Term1', 'Definiton1', $1),
                           ('Term2', 'Definition2', $2),
                           ('Term3', 'Definition3', $3),
                           ('GroupTerm1', 'Definition4', $4)
                           RETURNING id`, [setIds[0].id, setIds[1].id, setIds[2].id, setIds[3].id])
    const flashcardIds = result5.rows

    // create a group
    const result2 = await db.query(`INSERT INTO groups (name, description, created_by)
                    VALUES ('Group1', 'Description1', 'u1')
                    RETURNING id`)
    const group1Id = result2.rows[0]

    // add u1 to that group
    await db.query(`INSERT INTO groups_members (group_id, member_username)
                    VALUES ($1, $2), ($3, $4)`, [group1Id.id, 'u1', group1Id.id, 'u3'])

    // add a set to that group
    await db.query(`INSERT INTO groups_sets (set_id, group_id)
    VALUES ($1, $2)`, [setIds[3].id, group1Id.id])

    // add a group post
    const result3 = await db.query(`INSERT INTO group_posts (text, posted_by, group_id)
                    VALUES ('Post content', 'u3', $1)
                    RETURNING id`, [group1Id.id])
    const postIds = result3.rows[0]
    
    // add a reply to that post
    const result4 = await db.query(`INSERT INTO group_posts (text, posted_by, group_id, reply_to)
                                    VALUES ('First reply', 'u1', $1, $2)`, [group1Id.id, postIds.id])
    
    // add a comment
    await db.query(`INSERT INTO flashcard_comments (text, posted_by, flashcard_id)
                                    VALUES ('Comment', 'u2', $1)`, [flashcardIds[0].id])
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1" });
const u2Token = createToken({ username: "u2" });
const u3Token = createToken({ username: 'u3' });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  u3Token
};