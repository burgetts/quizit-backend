
"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  u3Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /:id */
describe("GET /:id", function () {
    test("works for public flashcards", async function () {
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id

        const resp = await request(app)
        .get(`/flashcards/${flashcardId}`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('flashcard')
        expect(resp.body.flashcard).toHaveProperty('sideOneText', 'Term1')
    })
    test("works for private flashcards - owner", async function () {
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term2'`)
        const flashcardId = result.rows[0].id

        const resp = await request(app)
        .get(`/flashcards/${flashcardId}`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('flashcard')
        expect(resp.body.flashcard).toHaveProperty('sideOneText', 'Term2')
    })
    test("unauthorized for private flashcards - not owner", async function () {
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term2'`)
        const flashcardId = result.rows[0].id

        const resp = await request(app)
        .get(`/flashcards/${flashcardId}`)
        .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toBe(401)
    })
})

/************************************** PATCH /:id */
describe('PATCH /:id', function() {
    test("works - current user can update their own flashcards", async function (){
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id

        const updatedFlashcard = {sideOneText: "Updated1", sideTwoText: "Updated2", sideOneImageUrl: '', sideTwoImageUrl: ''}
        const resp = await request(app)
        .patch(`/flashcards/${flashcardId}`)
        .set("authorization", `Bearer ${u1Token}`)
        .send(updatedFlashcard)

        expect(resp.statusCode).toBe(201)
        expect(resp.body).toHaveProperty('flashcard')
        expect(resp.body.flashcard).toHaveProperty('sideOneText', 'Updated1')
    })
    test("Unauthorized if a user tries to update another user's flashcards", async function() {
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id

        const updatedFlashcard = {sideOneText: "Updated1", sideTwoText: "Updated2", sideOneImageUrl: '', sideTwoImageUrl: ''}
        const resp = await request(app)
        .patch(`/flashcards/${flashcardId}`)
        .set("authorization", `Bearer ${u2Token}`)
        .send(updatedFlashcard)

        expect(resp.statusCode).toBe(401)
    })
    test("Not found error for invalid flashcard id", async function() {
        const updatedFlashcard = {sideOneText: "Updated1", sideTwoText: "Updated2", sideOneImageUrl: '', sideTwoImageUrl: ''}
        const resp = await request(app)
        .patch(`/flashcards/999`)
        .set("authorization", `Bearer ${u2Token}`)
        .send(updatedFlashcard)

        expect(resp.statusCode).toBe(404)
    })

})

/************************************** POST / */
describe("POST /:id", function() {
    test("works - add flashcard to own set", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
        const setId = result.rows[0].id

        const newFlashcard = {sideOneText: "Set1Term2", sideTwoText: "Set1Term2", setId: setId, sideOneImageUrl: '', sideTwoImageUrl: ''}
        const resp = await request(app)
        .post(`/flashcards`)
        .set("authorization", `Bearer ${u1Token}`)
        .send(newFlashcard)

        expect(resp.statusCode).toBe(201)
        expect(resp.body).toHaveProperty('flashcard')
        expect(resp.body.flashcard).toHaveProperty('sideOneText', 'Set1Term2')
    })
    test("Unauthorized if another user tries to add flashcard to another person's set", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
        const setId = result.rows[0].id

        const newFlashcard = {sideOneText: "Set1Term2", sideTwoText: "Set1Term2", setId: setId, sideOneImageUrl: '', sideTwoImageUrl: ''}
        const resp = await request(app)
        .post(`/flashcards`)
        .set("authorization", `Bearer ${u2Token}`)
        .send(newFlashcard)

        expect(resp.statusCode).toBe(401)
    })
    test("BadRequestError if invalid flashcard data sent", async function(){
        const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
        const setId = result.rows[0].id

        const newFlashcard = {sideTwoText: "Set1Term2", setId: setId, sideTwoImageUrl: ''}
        const resp = await request(app)
        .post(`/flashcards`)
        .set("authorization", `Bearer ${u1Token}`)
        .send(newFlashcard)

        expect(resp.statusCode).toBe(400)
    })
})

/************************************** DELETE /:id */
describe("DELETE /:id", function(){
    test("works - can delete own flashcards", async function() {
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id

        const resp = await request(app)
        .delete(`/flashcards/${flashcardId}`)
        .set("authorization", `Bearer ${u1Token}`)

        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('deleted', flashcardId)
    })
    test("Unauthorized if a user tries to delete another user's flashcard", async function () {
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id

        const resp = await request(app)
        .delete(`/flashcards/${flashcardId}`)
        .set("authorization", `Bearer ${u2Token}`)

        expect(resp.statusCode).toBe(401)
    })
})

/************************************** GET /:id/comments */
describe("GET /:id/comments", function(){
    test("works - get all a flashcard's comments", async function(){
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id

        const resp = await request(app)
        .get(`/flashcards/${flashcardId}/comments`)
        .set("authorization", `Bearer ${u1Token}`)

        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('comments')
        expect(resp.body.comments.length).toBe(1)
        expect(resp.body.comments[0].text).toEqual('Comment')
    })
    test("401 for user who isn't logged in", async function(){
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id

        const resp = await request(app)
        .get(`/flashcards/${flashcardId}/comments`)
        expect(resp.statusCode).toBe(401)
    })
})

/************************************** POST /:id/comments */
describe("POST /:id/comments", function(){
    test("works - can add a comment to a flashcard", async function(){
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id
        const newComment = {text: 'A comment for testing'}

        const resp = await request(app)
        .post(`/flashcards/${flashcardId}/comments`)
        .send(newComment)
        .set("authorization", `Bearer ${u1Token}`)

        expect(resp.status).toBe(201)
        expect(resp.body).toHaveProperty('comment')
        expect(resp.body.comment).toHaveProperty('text', 'A comment for testing')
    })
    test("401 if user is not logged in", async function(){
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id
        const newComment = {text: 'A comment for testing'}

        const resp = await request(app)
        .post(`/flashcards/${flashcardId}/comments`)
        .send(newComment)

        expect(resp.status).toBe(401)
    })
})

/************************************** PATCH /:id/comments/:commentId */
describe("PATCH /comments/:commentId",  function(){
    test("works - can update a comment", async function() {
    const result2 = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
    const commentId = result2.rows[0].id
    
    const resp = await request(app)
    .patch(`/flashcards/comments/${commentId}`)
    .send({text: 'Updated!'})
    .set("authorization", `Bearer ${u2Token}`)
    
    expect(resp.statusCode).toBe(201)
    expect(resp.body).toHaveProperty('comment')
    expect(resp.body.comment).toHaveProperty('text', 'Updated!')
    })
    test("401 for user who didn't write the comment", async function(){
    
        const result2 = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const commentId = result2.rows[0].id
        
        const resp = await request(app)
        .patch(`/flashcards/comments/${commentId}`)
        .send({text: 'Updated!'})
        .set("authorization", `Bearer ${u1Token}`)

        expect(resp.statusCode).toBe(401)
    })
})

/************************************** DELETE /:id/comments */
describe("DELETE /comments/:commentId", function(){
    test("works - can delete a comment", async function(){
        const result2 = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const commentId = result2.rows[0].id

        const resp = await request(app)
        .delete(`/flashcards/comments/${commentId}`)
        .set("authorization", `Bearer ${u2Token}`)

        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('deleted', commentId)
    })
    test("401 if another user tries to delete the comment", async function(){
        const result2 = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const commentId = result2.rows[0].id

        const resp = await request(app)
        .delete(`/flashcards/comments/${commentId}`)
        .set("authorization", `Bearer ${u1Token}`)

        expect(resp.statusCode).toBe(401)     
    })
})

/************************************** POST /:id/comments/:commentId/upvote */
describe("POST /comments/:commentId/upvote", function(){
    test("works - can upvote flashcard", async function(){
        const result2 = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const commentId = result2.rows[0].id

        const resp = await request(app)
        .post(`/flashcards/comments/${commentId}/upvote`)
        .set("authorization", `Bearer ${u3Token}`)

        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({upvotes: 1})
    })
    test("user who isn't logged in can't upvote", async function(){
        const result2 = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const commentId = result2.rows[0].id

        const resp = await request(app)
        .post(`/flashcards/comments/${commentId}/upvote`)

        expect(resp.statusCode).toBe(401) 
    })
})

/************************************** POST /:id/comments/:commentId/downvote */
describe("POST /comments/:commentId/downvote", function(){
    test("works - can downvote flashcard", async function(){
        const result2 = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const commentId = result2.rows[0].id

        const resp = await request(app)
        .post(`/flashcards/comments/${commentId}/downvote`)
        .set("authorization", `Bearer ${u3Token}`)

        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({downvotes: 1})
    })
    test("user who isn't logged in can't downvote", async function(){
        const result2 = await db.query(`SELECT id FROM flashcard_comments WHERE text='Comment'`)
        const commentId = result2.rows[0].id

        const resp = await request(app)
        .post(`/flashcards/comments/${commentId}/downvote`)

        expect(resp.statusCode).toBe(401) 
    })   
})