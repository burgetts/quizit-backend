"use strict";

const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
  } = require("../expressError");

const db = require("../db.js");
const app = require("../app");
const Flashcard = require("../models/flashcard");

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
describe("get", function () {
    test("works", async function() {
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id
        const flashcard = await Flashcard.get(flashcardId)
        expect(flashcard).toHaveProperty('sideTwoText', 'Definition1')
    })
    test("NotFoundError for invalid flashcard id", async function(){
        try {
            await Flashcard.get(999)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** add */
describe("add", function () {
    test("works with text only", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
        const setId = result.rows[0].id
        const newFlashcard = {sideOneText: 'Test1', sideTwoText: 'Test2', setId: setId}
        const flashcard = await Flashcard.add(newFlashcard)
        expect(flashcard).toHaveProperty('sideOneText', 'Test1')
        expect(flashcard).toHaveProperty('sideTwoText', 'Test2')
    })
    test("works with images only", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
        const setId = result.rows[0].id
        const newFlashcard = {sideOneImageUrl: 'test1.jpg', sideTwoImageUrl: 'test2.jpg', setId: setId}
        const flashcard = await Flashcard.add(newFlashcard)
        expect(flashcard).toHaveProperty('sideOneImageUrl', 'test1.jpg')
        expect(flashcard).toHaveProperty('sideTwoImageUrl', 'test2.jpg')
    })
    test("works with mix of text and images", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
        const setId = result.rows[0].id
        const newFlashcard = {sideOneText: 'Test1', sideTwoText: 'Test2', sideOneImageUrl: 'test1.jpg', sideTwoImageUrl: 'test2.jpg', setId: setId}
        const flashcard = await Flashcard.add(newFlashcard)
        expect(flashcard).toHaveProperty('sideOneText', 'Test1')
        expect(flashcard).toHaveProperty('sideTwoText', 'Test2')
        expect(flashcard).toHaveProperty('sideOneImageUrl', 'test1.jpg')
        expect(flashcard).toHaveProperty('sideTwoImageUrl', 'test2.jpg')
    })
    test("Error for invalid data", async function(){
        try {
            await Flashcard.get(999)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** update */
describe("add", function() {
    test("works - add a flashcard", async function() {
        const result = await db.query(`SELECT id FROM sets WHERE name='Set1'`)
        const setId = result.rows[0].id
        const newFlashcardData = {sideOneText: 'Term2', sideTwoText: 'Definition2', setId: setId}
        const newFlashcard = await Flashcard.add(newFlashcardData)
        expect(newFlashcard).toEqual({
            ...newFlashcardData, 
            sideOneImageUrl: '',
            sideTwoImageUrl: '',
            id: expect.any(Number)
        })
    })
    test("BadRequestError if invalid data", async function() {
        try {
            const newFlashcardData = {sideTwoText: 'Definition2', setId: 1}
        } catch(e) {
            expect(e instanceof BadRequestError).toBeTruthy()
        }
    })
})

/************************************** delete */
describe("delete", function() {
    test("works - deletes a flashcard", async function() {
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id
        const deleted = await Flashcard.delete(flashcardId)
        expect(deleted).toHaveProperty('deleted', flashcardId)
        try {
            await Flashcard.get(flashcardId)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
    test("NotFoundError for invalid flashcard id", async function() {
        try {
            await Flashcard.delete(999)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError)
        }
    })
})

/************************************** getComments */
describe("getComments", function(){
    test("works - get all comments from a flashcard", async function(){
        const result = await db.query(`SELECT id FROM flashcards WHERE side_one_text='Term1'`)
        const flashcardId = result.rows[0].id
        const comments = await Flashcard.getComments(flashcardId)
        expect(comments.length).toEqual(1)
        expect(comments[0].text).toEqual('Comment')
    })
    test("NotFoundError for invalid flashcard id", async function() {
        try {
            await Flashcard.getComments(999)
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError)
        }
    })
})
