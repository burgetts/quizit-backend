"use strict";

const {
    NotFoundError
  } = require("../expressError");

const db = require("../db.js");
const app = require("../app");
const Comment = require("../models/comment");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll
  } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** get */
describe("get", function(){
    test("works - gets comment by id", async function() {
        const result = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const commentFromDb = result.rows[0]
        const comment = await Comment.get(commentFromDb.id)
        expect(comment).toEqual({
            id: expect.any(Number),
            text: "Comment",
            postedBy: 'u2',
            flashcardId: expect.any(Number),
            upvotes: 0,
            downvotes: 0,
            datePosted: expect.any(Date)
        })
    })
    test("NotFoundError for invalid id", async function(){
        try {
            await Comment.get(999)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** add */
describe("add", function(){
    test("works - adds a comment", async function(){
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id
        const newComment = {text: 'New comment', postedBy: 'u1', flashcardId: flashcardId }

        const comment = await Comment.add(newComment)
        expect(comment).toEqual({
            id: expect.any(Number),
            text: "New comment",
            postedBy: 'u1',
            flashcardId: expect.any(Number),
            upvotes: 0,
            downvotes: 0,
            datePosted: expect.any(Date)
        })
    })
})

/************************************** update */
describe("update", function(){
    test("works - can update text", async function(){
        const result = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const id = result.rows[0].id

        const comment = await Comment.update(id, 'Updated text')
        expect(comment).toEqual({
            id: expect.any(Number),
            text: "Updated text",
            postedBy: 'u2',
            flashcardId: expect.any(Number),
            upvotes: 0,
            downvotes: 0,
            datePosted: expect.any(Date)   
        })
    })
    test("NotFoundError for comment id", async function(){
        try {
            await Comment.update(999, 'Updated text')
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** delete */
describe("delete", function(){
    test("works - can delete a comment", async function(){
        const result = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const id = result.rows[0].id

        const deleted = await Comment.delete(id)
        expect(deleted).toEqual({deleted: id})
        try {
            await Comment.get(id)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})
/************************************** upvote */
describe("upvote", function(){
    test("works - can upvote a comment", async function(){
        const result = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const id = result.rows[0].id

        const upvote = await Comment.upvote(id)
        
        expect(upvote).toEqual({upvotes: 1})
    })
})

/************************************** downvote */
describe("downvote", function(){
    test("works - can downvote a comment", async function(){
        const result = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const id = result.rows[0].id

        const downvote = await Comment.downvote(id)
        
        expect(downvote).toEqual({downvotes: 1})
    })
})