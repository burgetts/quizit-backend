"use strict";

const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
  } = require("../expressError");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

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

/************************************** authenticate */

describe("authenticate", function () {

    test("works", async function () {
      const user = await User.authenticate("u1", "password1");
      expect(user).toEqual({
        username: "u1",
        firstName: "User1",
        email: "u1@email.com",
      });
    });

    test("unauth if no such user", async function () {
        try {
          await User.authenticate("nope", "password");
          fail();
        } catch (err) {
          expect(err instanceof UnauthorizedError).toBeTruthy();
        }
    });

    test("unauth if wrong password", async function () {
        try {
          await User.authenticate("u1", "wrong");
          fail();
        } catch (err) {
          expect(err instanceof UnauthorizedError).toBeTruthy();
        }
      });
});

/************************************** register */

describe("register", function () {
    const newUser = {
      username: "new",
      firstName: "Test",
      email: "test@test.com",
    };

    test("works", async function () {
        let user = await User.register({
          ...newUser,
          password: "password",
        });
        expect(user).toEqual(newUser);
        const found = await db.query("SELECT * FROM users WHERE username = 'new'");
        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
    });

    test("bad request with duplicate data", async function () {
        try {
          await User.register({
            ...newUser,
            password: "password",
          });
          await User.register({
            ...newUser,
            password: "password",
          });
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
})

/************************************** update */

describe("update", function () {
    test("works", async function () {
        const updateData = {firstName: 'Changed', password: 'password1', email: 'u1@email.com', profilePicture: ''}
        let updatedUser = await User.update('u1', updateData)
        expect(updatedUser.firstName).toEqual('Changed')
    })
    test("doesn't work with incomplete data", async function () {
        try {
            const updateData = { password: 'password1', email: 'u1@email.com', profilePicture: ''}
            await User.update('u1', updateData)
            fail()
        } catch (e) {
            expect(e instanceof Error).toBeTruthy()
        }
    })
    test("doesn't work with invalid user", async function () {
        try {
            const updateData = {firstName: 'Changed', password: 'password1', email: 'u1@email.com', profilePicture: ''}
            await User.update('no', updateData)
            fail()
        } catch (e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** getGroups */
describe("getGroups", function () {
    test("works", async function() {
        const groups = await User.getGroups('u1')
        expect(groups.length).toEqual(1)
        expect(groups[0].name).toEqual('Group1')
    })
    test("returns empty array if user has no groups", async function () {
        const groups = await User.getGroups('u2')
        expect(groups).toEqual([])
    })
    test("throws error if user doesn't exist", async function () {
        try{ 
            await User.getGroups('no')
            fail()
        } catch (e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})
/************************************** getSets */
describe("getGroups", function () {
    test("works", async function() {
        const sets = await User.getSets('u1')
        expect(sets.length).toEqual(2)
        expect(sets[0].name).toEqual('Set1')
    })
    test("throws error if user doesn't exist", async function () {
        try{ 
            await User.getGroups('no')
            fail()
        } catch (e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})
/************************************** get */
describe("get", function() {
    test("works", async function() {
        const user = await User.get('u1')
        expect(user.firstName).toEqual('User1')
        expect(user).toHaveProperty('sets')
        expect(user).toHaveProperty('groups')
    })
    test("throws error for invalid user", async function() {
        try {
            await User.get('no')
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})
/************************************** joinGroup */
describe("joinGroup", function() {
    test("works", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0]
        await User.joinGroup('u2', groupId.id)
        const u2Groups = await User.getGroups('u2')
        expect(u2Groups.length).toEqual(1)
        expect(u2Groups[0].name).toEqual('Group1')
    })
    test("doesn't work for invalid user", async function() {
        try {
            const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
            const groupId = result.rows[0]
            await User.joinGroup('no', groupId.id)   
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
    test("doesn't work for invalid group id", async function() {
        try {
            await User.joinGroup('u1', 999)   
            fail()
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** leaveGroup */
describe("leaveGroup", function() {
    test("works - user can leave group", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0]
        await User.leaveGroup('u3', groupId.id)
        const groups = await User.getGroups('u3')
        expect(groups.length).toBe(0)
    })
    test("owner can't leave their own group", async function() {
        try {
            const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
            const groupId = result.rows[0]
            await User.leaveGroup('u1', groupId.id)
            fail()
        } catch(e) {
            expect(e instanceof BadRequestError).toBeTruthy()
        }
    })
})