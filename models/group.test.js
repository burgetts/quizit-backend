"use strict";

const {
    NotFoundError
  } = require("../expressError");

const db = require("../db.js");
const app = require("../app");
const Group = require("../models/group");

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

/************************************** getAll */
describe("getAll", function() {
    test("works - gets all groups", async function(){
        const groups = await Group.getAll()
        expect(groups.length).toBe(1)
    })
})

/************************************** get */
describe("get", function() {
    test("works - gets a group by id", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id
        const group = await Group.get(groupId)
        expect(group.name).toEqual('Group1')
        expect(group.createdBy).toEqual('u1')
    })
    test("NotFoundError if no group with that id", async function() {
        try {
            await Group.get(999)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** getMembers */
describe("getMembers", function() {
    test("works", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id
        const members = await Group.getMembers(groupId)
        expect(members.length).toEqual(2)
        expect(members[0].username).toEqual('u1')
        expect(members[1].username).toEqual('u3')
    })
    test("NotFoundError if group with that id doesn't exist", async function() {
        try {
            const members = await Group.getMembers(999)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** getSets */
describe("getSets", function() {
    test("works", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id
        const sets = await Group.getSets(groupId)
        expect(sets.length).toEqual(1)
    })
    test("Empty array if group with that id doesn't exist", async function() {
        try {
            const sets = await Group.getSets(999)
            expect(sets).toEqual([])
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** add */
describe("add", function(){
    test("works", async function() {
        const newGroupData = { name: 'BME 304', description: 'A study group for BME 304', groupPicture: '', createdBy: 'u3' }
        const newGroup = await Group.add(newGroupData)
        expect(newGroup).toEqual({
            id: expect.any(Number),
            name: 'BME 304', 
            description: 'A study group for BME 304', 
            groupPicture: expect.any(String), 
            createdBy: 'u3'
        })
    })
    test("Error for invalid input data", async function() {
        try {
            const newGroupData = {name: 'BME 304'}
            await Group.add(newGroupData)
            fail()
        } catch(e) {
            expect(e instanceof Error).toBeTruthy()
        }
    })
})

/************************************** update */
describe("update", function() {
    test("works", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id

        const updateData = {  name: 'Group1Updated', description: 'An updated description', groupPicture: 'www.update.jpg' }
        const updatedGroup = await Group.update(groupId, updateData)
        expect(updatedGroup).toEqual({
            id: expect.any(Number), 
            createdBy: 'u1',
            ...updateData
        })
    })
    test("NotFoundError for invalid group id", async function(){
        try {
            const updateData = {  name: 'Group1Updated', description: 'An updated description', groupPicture: 'www.update.jpg' }
            await Group.update(999, updateData)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
    test("Error for invalid input data", async function() {
        try {
            const updateGroupData = {name: 'BME 304'}
            await Group.update(updateGroupData)
            fail()
        } catch(e) {
            expect(e instanceof Error).toBeTruthy()
        }
    })
})

/************************************** delete */
describe("delete", function() {
    test("works - deletes group", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id

        const deleted = await Group.delete(groupId)
        expect(deleted).toEqual({deleted: groupId})
    })
    test("NotFoundError for invalid group id", async function(){
        try {
            await Group.delete(999)
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** addSet */
describe("add set", function() {
    test("works", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id

        const newSetData = { name: 'Group Set', description: 'A set associated with Group1', sideOneName: 'Term', sideTwoName: 'Definition', createdBy: 'u3' }
        const newSet = await Group.addSet(groupId, newSetData)
        expect(newSet).toEqual({
            id: expect.any(Number),
            dateCreated: expect.any(Date),
            ...newSetData
        })
    })
    test("NotFoundError if group with that id doesn't exist", async function() {
        try {
            const newSetData = { name: 'Group Set', description: 'A set associated with Group1', sideOneName: 'Term', sideTwoName: 'Definition', createdBy: 'u3' }
            await Group.addSet(999, newSetData)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
    test("Error for invalid set data", async function() {
        try {
            const newSetData = { sideOneName: 'Term', sideTwoName: 'Definition', createdBy: 'u3' }
            await Group.addSet(999, newSetData)
            fail()
        } catch(e) {
            expect(e instanceof Error).toBeTruthy()
        }
    })
})

/************************************** getPosts */
describe("getPosts", function(){
    test("works - gets all group posts", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id

        const posts = await Group.getPosts(groupId)
        console.log(posts)
        expect(posts.length).toEqual(1)
        expect(posts[0].text).toEqual('Post content')
    })
})