"use strict";

const {
    NotFoundError
  } = require("../expressError");

const db = require("../db.js");
const app = require("../app");
const Set = require("../models/set");

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

/************************************** getPublicSets */
describe("getPublicSets", function() {
    test("works", async function() {
        const publicSets = await Set.getPublicSets()
        expect(publicSets.length).toEqual(2)
    })
})
/************************************** get */
describe("get", function() {
    test("works", async function(){
        const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
        const setId = result.rows[0].id
        const set1 = await Set.get(setId)
        expect(set1).toEqual({
            id: expect.any(Number),
            name: 'Set1',
            description:'Test set 1', 
            sideOneName: 'Term', 
            sideTwoName: 'Definition', 
            createdBy: 'u1', 
            hidden: false,
            flashcards: expect.any(Array),
            dateCreated: expect.any(Date)
        })
    })
    test("NotFoundError for invalid set id", async function() {
        try {
            await Set.get(999)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** add */
describe("add", function() {
    test("works", async function() {
        const newSet = { hidden: false, name: 'newSet', description: 'New set for add testing', createdBy: 'u2', sideOneName: 'Term', sideTwoName: 'Definition'}
        const set = await Set.add(newSet)
        expect(set).toEqual({
            ...newSet,
            id: expect.any(Number),
            dateCreated: expect.any(Date)
        })
    })
    test("Error for invalid new set data", async function() {
        try {
            await Set.add({name: 'NewSet'})
            fail()
        } catch(e) {
            expect(e instanceof Error).toBeTruthy()
        }
    })
})

/************************************** delete */
describe("delete", function() {
    test("works", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
        const setId = result.rows[0].id
        const deleted = await Set.delete(setId)
        expect(deleted).toBe(setId)
        try {
            await Set.get(setId)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
    test("NotFoundError for invalid set id", async function() {
        try {
            await Set.delete(999)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** update */
describe("update", function() {
    test("works", async function(){
        const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
        const setId = result.rows[0].id

        const updateData = {sideOneName: 'Updated1', sideTwoName: 'Updated2', name: 'Set1', description: 'Updated set for testing'}
        const updatedSet = await Set.update(setId, updateData)
        expect(updatedSet).toEqual({
            ...updateData,
            id: expect.any(Number),
            createdBy: 'u1',
            dateCreated: expect.any(Date)
        })
    })
    test("NotFoundError for invalid set id", async function() {
        try {
            const updateData = {sideOneName: 'Updated1', sideTwoName: 'Updated2', name: 'Set1', description: 'Updated set for testing'}
            await Set.update(999, updateData)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
    test("BadRequestError for invalid data", async function() {
        try {
            const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
            const setId = result.rows[0].id

            await Set.update(setId, {name: 'StillSet1'})
        } catch(e) {
            expect(e instanceof Error).toBeTruthy()
        }
    })
})
