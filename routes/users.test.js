
"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

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

/************************************** GET /:username */
describe("GET /:username", function () {
    test("works", async function () {
        const resp = await request(app)
        .get('/users/u1')
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body).toHaveProperty('user')
        expect(resp.body.user).toHaveProperty('username', 'u1')
        expect(resp.body.user).toHaveProperty('email', 'u1@email.com')
        expect(resp.body.user).toHaveProperty('sets')
        expect(resp.body.user).toHaveProperty('groups')
    })
    test("get user without email if not logged in user", async function () {
      const resp = await request(app)
          .get("/users/u2")
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toHaveProperty('user')
      expect(resp.body.user).toHaveProperty('username', 'u2')
      expect(resp.body.user).not.toHaveProperty('email')
    });
    test("doesn't work for invalid user", async function() {
        const resp = await request(app)
        .get('/users/no')
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(404)
    })
})

/************************************** PATCH /:username */
describe("/PATCH /:username", function() {
    test("works", async function () {
        const resp = await request(app)
        .patch('/users/u1')
        .send({
            firstName: 'Changed',
            email: 'u1@email.com',
            profilePicture: '',
            password: 'password1'
        })
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body).toHaveProperty('user')
        expect(resp.body.user).toHaveProperty('username', 'u1')
        expect(resp.body.user).toHaveProperty('firstName', 'Changed')
        expect(resp.statusCode).toBe(201)
    })
    test("doesn't work for incomplete/invalid data", async function() {
        const resp = await request(app)
        .patch('/users/u1')
        .send({
            email: 'u1@email.com',
            profilePicture: '',
            password: 'password1'
        })
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(400)
    })
    test("can't update another user", async function() {
        const resp = await request(app)
        .patch('/users/u2')
        .send({
            firstName: 'Changed',
            email: 'u1@email.com',
            profilePicture: '',
            password: 'password1'
        })
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(401) 
    })
})

/************************************** GET /:username/sets */
describe("/GET /:username/sets", function() {
    test("logged in user can see all their sets", async function() {
        const resp = await request(app)
        .get('/users/u1/sets')
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body.sets.length).toEqual(2)
    })
    test("other users can't see private sets", async function() {
        const resp = await request(app)
        .get('/users/u1/sets')
        .set("authorization", `Bearer ${u2Token}`)
        expect(resp.body.sets.length).toEqual(1)
    })
    test("404 for invalid user", async function() {
        const resp = await request(app)
        .get('/users/no/sets')
        .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toBe(404)
    })
    test("401 if not logged in", async function() {
        const resp = await request(app)
        .get('/users/u1/sets')
        expect(resp.statusCode).toBe(401)
    })
})
/************************************** GET /:username/groups */
describe("/GET /:username/groups", function() {
    test("can see a user's groups", async function() {
        const resp = await request(app)
        .get('/users/u1/groups')
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body.groups.length).toEqual(1)
    })
    test("404 for invalid user", async function() {
        const resp = await request(app)
        .get('/users/no/groups')
        .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toBe(404)
    })
    test("401 if not logged in", async function() {
        const resp = await request(app)
        .get('/users/u1/groups')
        expect(resp.statusCode).toBe(401)
    })
})

/************************************** POST /:username/groups/:id */
describe("/POST /:username/groups/id", function () {
    test("returns id of group that was joined", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id
        const resp = await request(app)
        .post(`/users/u2/groups/${groupId}`)
        .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('joined', groupId)
    })

    test("401 if not logged in", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id
        const resp = await request(app)
        .post(`/users/u2/groups/${groupId}`)
        expect(resp.statusCode).toBe(401)
    })

    test("can't add another user to a group", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id
        const resp = await request(app)
        .post(`/users/u2/groups/${groupId}`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(401)
    })
})

/************************************** DELETE /:username/groups/:id */
describe("/DELETE /:username/groups/id", function () {
    test("returns id of group that was left", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id
        const resp = await request(app)
        .delete(`/users/u3/groups/${groupId}`)
        .set("authorization", `Bearer ${u3Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('removed', groupId)
    })
    test("404 if user is not in group", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id
        const resp = await request(app)
        .delete(`/users/u2/groups/${groupId}`)
        .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toBe(404)
    })
    test("400 if owner tries to leave group", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id
        const resp = await request(app)
        .delete(`/users/u1/groups/${groupId}`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(400)
    })
})