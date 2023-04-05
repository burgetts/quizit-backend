
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
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET / */
describe("GET /", function () {
    test("works - gets all public sets", async function () {
        const resp = await request(app)
        .get('/sets')
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('sets')
        expect(resp.body.sets.length).toBe(2)
    })
    test("Unauthorized if not logged in", async function() {
        const resp = await request(app)
        .get('/sets')
        expect(resp.statusCode).toBe(401)
    })
})

/************************************** GET /:id */
describe("GET /:id", function() {
    test("works - owner can get their own set", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set2'`)
        const setId = result.rows[0].id

        const resp = await request(app)
        .get(`/sets/${setId}`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('set')
        expect(resp.body.set).toHaveProperty('name', 'Set2')
    })
    test("Unauthorized if a user tries to get someone else's private set", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set2'`)
        const setId = result.rows[0].id

        const resp = await request(app)
        .get(`/sets/${setId}`)
        .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toBe(401)
    })
    test("Users can get other users' public sets", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
        const setId = result.rows[0].id

        const resp = await request(app)
        .get(`/sets/${setId}`)
        .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('set')
        expect(resp.body.set).toHaveProperty('name', 'Set1')
    })
    test("404 for invalid set id", async function() {
        const resp = await request(app)
        .get(`/sets/999`)
        .set("authorization", `Bearer ${u2Token}`)

        expect(resp.statusCode).toBe(404)
    })
})

/************************************** PATCH /:id */
describe("PATCH /:id", function() {
    test("works - user can update their own sets", async function(){
        const result = await db.query(`SELECT id FROM sets WHERE name='Set2'`)
        const setId = result.rows[0].id

        const updateData = {name: 'UpdatedSet2', description: 'Updated set for testing', sideOneName: 'Term', sideTwoName: 'Definition'}

        const resp = await request(app)
        .patch(`/sets/${setId}`)
        .set("authorization", `Bearer ${u1Token}`)
        .send(updateData)

        expect(resp.statusCode).toBe(201)
        expect(resp.body).toHaveProperty('set')
        expect(resp.body.set).toHaveProperty('name', 'UpdatedSet2')
        expect(resp.body.set).toHaveProperty('id')
    })
    test("Unauthorized if a user tries to update another user's set", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set2'`)
        const setId = result.rows[0].id

        const updateData = {name: 'UpdatedSet2', description: 'Updated set for testing', sideOneName: 'Term', sideTwoName: 'Definition'}

        const resp = await request(app)
        .patch(`/sets/${setId}`)
        .set("authorization", `Bearer ${u2Token}`)
        .send(updateData)
        expect(resp.statusCode).toBe(401)
    })
    test("NotFoundError for invalid set id", async function(){
        const updateData = {name: 'UpdatedSet2', description: 'Updated set for testing', sideOneName: 'Term', sideTwoName: 'Definition'}

        const resp = await request(app)
        .patch(`/sets/999`)
        .set("authorization", `Bearer ${u2Token}`)
        .send(updateData)
        expect(resp.statusCode).toBe(404)
    })
    test("Bad request for invalid update data", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set2'`)
        const setId = result.rows[0].id

        const updateData = {sideOneName: 'Term', sideTwoName: 'Definition'}

        const resp = await request(app)
        .patch(`/sets/${setId}`)
        .set("authorization", `Bearer ${u1Token}`)
        .send(updateData)
        expect(resp.statusCode).toBe(400)   
    })
})

/************************************** POST / */
describe("post", function(){
    test("works - any logged in user can create a new post", async function() {
        const newSetData = { hidden: false, name: 'TestSet', description: 'A set for testing',  sideOneName: 'Term', sideTwoName: "Definition" }
        const resp = await request(app)
        .post(`/sets`)
        .set("authorization", `Bearer ${u1Token}`)
        .send(newSetData)
        expect(resp.statusCode).toBe(201)   
        expect(resp.body).toHaveProperty('set')
        expect(resp.body.set).toHaveProperty('name', 'TestSet')
    })
    test("Unauthorized if user is not logged in", async function() {
        const newSetData = { hidden: false, name: 'TestSet', description: 'A set for testing',  sideOneName: 'Term', sideTwoName: "Definition" }
        const resp = await request(app)
        .post(`/sets`)
        .send(newSetData)

        expect(resp.statusCode).toBe(401)   
    })
    test("Bad request if invalid new set data", async function(){
        const newSetData = { sideOneName: 'Term', sideTwoName: "Definition" }
        const resp = await request(app)
        .post(`/sets`)
        .set("authorization", `Bearer ${u1Token}`)
        .send(newSetData)

        expect(resp.statusCode).toBe(400)   
    })
})

/************************************** DELETE /:id */
describe("delete", function(){
    test("works - user can delete their own sets", async function(){
        const result = await db.query(`SELECT id FROM sets WHERE name='Set2'`)
        const setId = result.rows[0].id

        const resp = await request(app)
        .delete(`/sets/${setId}`)
        .set("authorization", `Bearer ${u1Token}`)

        expect(resp.status).toBe(200)
        expect(resp.body).toEqual({deleted: setId})
    })
    test("Unauthorized if a user tries to delete a set that isn't theirs", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set2'`)
        const setId = result.rows[0].id

        const resp = await request(app)
        .delete(`/sets/${setId}`)
        .set("authorization", `Bearer ${u2Token}`)
        expect(resp.status).toBe(401)
    })
})
