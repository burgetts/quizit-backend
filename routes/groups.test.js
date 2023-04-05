
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

/************************************** GET / */
describe("GET /", function() {
    test("works", async function(){
        const resp = await request(app)
        .get(`/groups`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('groups')
        expect(resp.body.groups.length).toEqual(1)
    })
    test("401 for user who isn't logged in", async function(){
        const resp = await request(app)
        .get(`/groups`)
        expect(resp.statusCode).toBe(401)
    })
})

/************************************** GET /:id */
describe("GET /:id", function(){
    test("works", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .get(`/groups/${group1Id}`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('group')
        expect(resp.body.group).toHaveProperty('name', 'Group1')
    })
    test("401 for user who isn't logged in", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .get(`/groups/${group1Id}`)
        expect(resp.statusCode).toBe(401)
    })
    test("404 for invalid group id", async function(){
        const resp = await request(app)
        .get(`/groups/999`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(404)
    })
})

/************************************** GET /:id/members */
describe('GET /:id/members', function() {
    test("works", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .get(`/groups/${group1Id}/members`)
        .set("authorization", `Bearer ${u1Token}`)

        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('members')
        expect(resp.body.members.length).toBe(2)
        expect(resp.body.members[0].username).toEqual('u1')
        expect(resp.body.members[1].username).toEqual('u3')
    })
    test("401 for user who isn't logged in", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .get(`/groups/${group1Id}/members`)
        expect(resp.statusCode).toBe(401)
    })
    test("404 for invalid group id", async function(){
        const resp = await request(app)
        .get(`/groups/999/members`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(404)
    })
})

/************************************** GET /:id/sets */
describe("GET /:id/sets", function() {
    test("works", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .get(`/groups/${group1Id}/sets`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('sets')
        expect(resp.body.sets.length).toBe(1)
        expect(resp.body.sets[0].name).toEqual('GroupSet1')
    })
    test("401 for user who isn't in the group", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        
        const resp = await request(app)
        .get(`/groups/${group1Id}/sets`)
        .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toBe(401)
    })
    test("401 for user who isn't logged in", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id

        const resp = await request(app)
        .get(`/groups/${group1Id}/sets`)
        expect(resp.statusCode).toBe(401)
    })
})

/************************************** POST / */
describe("POST /", function() {
    test("works - adds a group", async function(){
        const newGroupData = { name: 'BME 304', description: 'A study group for BME 304', groupPicture: '', createdBy: 'u3' }
        const resp = await request(app)
        .post(`/groups`)
        .send(newGroupData)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(201)
        expect(resp.body.group).toEqual({
            id: expect.any(Number),
            ...newGroupData,
            createdBy: 'u1'
        })
    })
    test("401 if user isn't logged in", async function(){
        const newGroupData = { name: 'BME 304', description: 'A study group for BME 304', groupPicture: '', createdBy: 'u3' }
        const resp = await request(app)
        .post(`/groups`)
        .send(newGroupData)
        expect(resp.statusCode).toBe(401)
    })
    test("400 if invalid new group data", async function() {
        const newGroupData = { description: 'A study group for BME 304', groupPicture: '', createdBy: 'u3' }
        const resp = await request(app)
        .post(`/groups`)
        .send(newGroupData)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(400)
    })
})

/************************************** PATCH /:id */
describe("PATCH /:id", function() {
    test("works - updates a group", async function(){
        const updateData = {  name: 'Group1Updated', description: 'An updated description', groupPicture: 'www.update.jpg' }
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .patch(`/groups/${group1Id}`)
        .send(updateData)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(201)
        expect(resp.body).toHaveProperty('group')
        expect(resp.body.group).toEqual({
            id: expect.any(Number),
            createdBy: 'u1',
            ...updateData
        })
    })
    test("401 for group members who aren't the owner", async function(){
        const updateData = {  name: 'Group1Updated', description: 'An updated description', groupPicture: 'www.update.jpg' }
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .patch(`/groups/${group1Id}`)
        .send(updateData)
        .set("authorization", `Bearer ${u3Token}`)
        expect(resp.statusCode).toBe(401)
    })
    test("401 for user who isn't logged in", async function() {
        const updateData = {  name: 'Group1Updated', description: 'An updated description', groupPicture: 'www.update.jpg' }
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .patch(`/groups/${group1Id}`)
        .send(updateData)
        expect(resp.statusCode).toBe(401)
    })
    test("400 for invalid update input data", async function() {
        const updateData = { description: 'An updated description', groupPicture: 'www.update.jpg' }
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .patch(`/groups/${group1Id}`)
        .send(updateData)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(400)
    })
})

/************************************** DELETE /:id */
describe("DELETE /:id", function() {
    test("works - deletes a group", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .delete(`/groups/${group1Id}`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({deleted: group1Id})
    })
    test("401 for user who is in group but doesn't own it", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .delete(`/groups/${group1Id}`)
        .set("authorization", `Bearer ${u3Token}`)
        expect(resp.statusCode).toBe(401)
    })
    test("401 for user who isn't logged in", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .delete(`/groups/${group1Id}`)
        expect(resp.statusCode).toBe(401)
    })
})

/************************************** POST /groups/:id/sets */
describe('POST /groups/:id/sets', function(){
    test("works - member can create a group set", async function(){
        const newSetData = { name: 'Group Set', description: 'A set associated with Group1', sideOneName: 'Term', sideTwoName: 'Definition' }
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .post(`/groups/${group1Id}/sets`)
        .send(newSetData)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(201)
        expect(resp.body).toHaveProperty('set')
        expect(resp.body.set).toEqual({
            id: expect.any(Number),
            createdBy: 'u1',
            dateCreated: expect.any(String),
            ...newSetData
        })

    } )
    test("401 for nonmembers who try to make a group set", async function(){
        const newSetData = { name: 'Group Set', description: 'A set associated with Group1', sideOneName: 'Term', sideTwoName: 'Definition' }
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .post(`/groups/${group1Id}/sets`)
        .send(newSetData)
        .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toBe(401)
    })
    test("401 for users who aren't logged in", async function(){
        const newSetData = { name: 'Group Set', description: 'A set associated with Group1', sideOneName: 'Term', sideTwoName: 'Definition' }
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        const resp = await request(app)
        .post(`/groups/${group1Id}/sets`)
        .send(newSetData)
        expect(resp.statusCode).toBe(401)
    })
})

/************************************** POST /:id/sets/:setId/flashcards */
// add a flashcard to a group set
describe("POST /:id/sets/:setId/flashcards", function(){
    test("works", async function(){
        // get set id
        const result1 = await db.query(`SELECT id FROM sets WHERE name='GroupSet1'`)
        const setId = result1.rows[0].id

        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id

        const newFlashcardData = { sideOneText: 'NewText', sideTwoText: "NewText1", sideOneImageUrl: '', sideTwoImageUrl: '' }
        const resp1 = await request(app)
        .post(`/groups/${group1Id}/sets/${setId}/flashcards`)
        .send(newFlashcardData)
        .set("authorization", `Bearer ${u1Token}`)
    
        expect(resp1.statusCode).toBe(201)
        expect(resp1.body).toHaveProperty('flashcard')
        expect(resp1.body.flashcard).toEqual({
            id: expect.any(Number),
            ...newFlashcardData,
            setId: setId
        })
    })
    test("401 for user who isn't a group member", async function(){
        // get set id
        const result1 = await db.query(`SELECT id FROM sets WHERE name='GroupSet1'`)
        const setId = result1.rows[0].id

        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id

        const newFlashcardData = { sideOneText: 'NewText', sideTwoText: "NewText1", sideOneImageUrl: '', sideTwoImageUrl: '' }
        const resp1 = await request(app)
        .post(`/groups/${group1Id}/sets/${setId}/flashcards`)
        .send(newFlashcardData)
        .set("authorization", `Bearer ${u2Token}`)
    
        expect(resp1.statusCode).toBe(401)
    })
    test("401 for user who isn't logged in", async function(){
        // get set id
        const result1 = await db.query(`SELECT id FROM sets WHERE name='GroupSet1'`)
        const setId = result1.rows[0].id

        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id

        const newFlashcardData = { sideOneText: 'NewText', sideTwoText: "NewText1", sideOneImageUrl: '', sideTwoImageUrl: '' }
        const resp1 = await request(app)
        .post(`/groups/${group1Id}/sets/${setId}/flashcards`)
        .send(newFlashcardData)
    
        expect(resp1.statusCode).toBe(401)
    })
    test("400 for bad input data", async function(){
        // get group id
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        // get set id
        const result1 = await db.query(`SELECT id FROM sets WHERE name='GroupSet1'`)
        const setId = result1.rows[0].id
        
        const newFlashcardData = { sideTwoText: "NewText1", sideTwoImageUrl: '' }
        const resp1 = await request(app)
        .post(`/groups/${group1Id}/sets/${setId}/flashcards`)
        .send(newFlashcardData)
        .set("authorization", `Bearer ${u1Token}`)
            
        expect(resp1.statusCode).toBe(400)
    })
})

/************************************** PATCH /:id/flashcards/:flashcardId */
// update a flashcard in a group set
describe("PATCH /:id/flashcards/:flashcardId", function() {
    test("works - group member can update a flashcard in a group set", async function(){
        // get group id
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        // get flashcard id
        const result1 = await db.query(`SELECT id FROM flashcards WHERE side_one_text='GroupTerm1'`)
        const flashcardId = result1.rows[0].id

        const updateFlashcardData = {sideOneText: 'updatedGroupTerm', sideTwoText: 'updatedGroupDefinition', sideOneImageUrl: '', sideTwoImageUrl:'' }
        const resp = await request(app)
        .patch(`/groups/${group1Id}/flashcards/${flashcardId}`)
        .send(updateFlashcardData)
        .set("authorization", `Bearer ${u1Token}`)

        expect(resp.statusCode).toBe(201)
        expect(resp.body).toHaveProperty('flashcard')
        expect(resp.body.flashcard).toEqual({
            ...updateFlashcardData,
            id: flashcardId,
            setId: expect.any(Number)
        })
    })
    test("401 for user who isn't logged in", async function(){
         // get group id
         const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
         const group1Id = result.rows[0].id
         // get flashcard id
         const result1 = await db.query(`SELECT id FROM flashcards WHERE side_one_text='GroupTerm1'`)
         const flashcardId = result1.rows[0].id
 
         const updateFlashcardData = {sideOneText: 'updatedGroupTerm', sideTwoText: 'updatedGroupDefinition', sideOneImageUrl: '', sideTwoImageUrl:'' }
         const resp = await request(app)
         .patch(`/groups/${group1Id}/flashcards/${flashcardId}`)
         .send(updateFlashcardData)
         
         expect(resp.statusCode).toBe(401)
    })
    test("401 for user who isn't in the group", async function(){
        // get group id
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        // get flashcard id
        const result1 = await db.query(`SELECT id FROM flashcards WHERE side_one_text='GroupTerm1'`)
        const flashcardId = result1.rows[0].id

        const updateFlashcardData = {sideOneText: 'updatedGroupTerm', sideTwoText: 'updatedGroupDefinition', sideOneImageUrl: '', sideTwoImageUrl:'' }
        const resp = await request(app)
        .patch(`/groups/${group1Id}/flashcards/${flashcardId}`)
        .send(updateFlashcardData)
        .set("authorization", `Bearer ${u2Token}`)
        
        expect(resp.statusCode).toBe(401)
   })
})

/************************************** DELETE  /:id/flashcards/:flashcardId */
// delete a flashcard from a group set
describe("DELETE /:id/flashcards/:flashcardId", function(){
    test("works - member can delete a flashcard from a group set", async function(){
            // get group id
            const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
            const group1Id = result.rows[0].id

            // get flashcard id
            const result1 = await db.query(`SELECT id FROM flashcards WHERE side_one_text='GroupTerm1'`)
            const flashcardId = result1.rows[0].id 

            const resp = await request(app)
            .delete(`/groups/${group1Id}/flashcards/${flashcardId}`)
            .set("authorization", `Bearer ${u1Token}`)

            expect(resp.statusCode).toBe(200)
            expect(resp.body).toHaveProperty('deleted', flashcardId)
    })
    test("401 for user who isn't in the group", async function(){
             // get group id
            const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
            const group1Id = result.rows[0].id
        
            // get flashcard id
            const result1 = await db.query(`SELECT id FROM flashcards WHERE side_one_text='GroupTerm1'`)
            const flashcardId = result1.rows[0].id 
        
            const resp = await request(app)
            .delete(`/groups/${group1Id}/flashcards/${flashcardId}`)
            .set("authorization", `Bearer ${u2Token}`)
        
            expect(resp.statusCode).toBe(401)
    })
    test("401 for user who isn't logged in", async function(){
        // get group id
       const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
       const group1Id = result.rows[0].id
   
       // get flashcard id
       const result1 = await db.query(`SELECT id FROM flashcards WHERE side_one_text='GroupTerm1'`)
       const flashcardId = result1.rows[0].id 
   
       const resp = await request(app)
       .delete(`/groups/${group1Id}/flashcards/${flashcardId}`)
   
       expect(resp.statusCode).toBe(401)
    })
})

/************************************** GET /:id/posts */
describe("GET /:id/posts", function() {
    test("works - get posts back", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id

        const resp = await request(app)
        .get(`/groups/${group1Id}/posts`)
        .set("authorization", `Bearer ${u1Token}`)

        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('posts')
        expect(resp.body.posts[0]).toHaveProperty('text', 'Post content')
    })
    test("doesn't work for non group member", async function() {
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id

        const resp = await request(app)
        .get(`/groups/${group1Id}/posts`)
        .set("authorization", `Bearer ${u2Token}`)

        expect(resp.statusCode).toBe(401)
    })
})

/************************************** POST /:id/posts/:postId/reply */
describe("POST /:id/posts/:postId/reply", function(){
    test("works - add a reply", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id

        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id

        const resp = await request(app)
        .post(`/groups/${group1Id}/posts/${postId}/reply`)
        .send({text: 'This is a reply to a post'})
        .set("authorization", `Bearer ${u3Token}`)

        expect(resp.statusCode).toBe(201)
        expect(resp.body).toHaveProperty('reply')
    })
})

/************************************** POST /:id/posts */
describe("POST /:id/posts", function(){
    test("works - add a post", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id

        const resp = await request(app)
        .post(`/groups/${group1Id}/posts`)
        .send({text: 'This is a reply to a post'})
        .set("authorization", `Bearer ${u3Token}`)

        expect(resp.statusCode).toBe(201)
        expect(resp.body).toHaveProperty('post')
       
    })
})

 /************************************** GET /:id/posts/:postId/eplies */
 describe("GET /:id/replies", function(){
    test("works - get all post replies", async function(){
        // get group
        const result0 = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result0.rows[0].id

        const result = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result.rows[0].id

        const resp = await request(app)
        .get(`/groups/${group1Id}/posts/${postId}/replies`)
        .set("authorization", `Bearer ${u1Token}`)

        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('replies')
        expect(resp.body.replies[0]).toHaveProperty('text', 'First reply')
    })
    test("401 for members not in group", async function(){
        // get group
        const result0 = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result0.rows[0].id
        
        const result = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result.rows[0].id

        const resp = await request(app)
        .get(`/groups/${group1Id}/posts/${postId}/replies`)
        .set("authorization", `Bearer ${u2Token}`)

        expect(resp.statusCode).toBe(401)
    })
 })

/************************************** PATCH /:id/posts/:postId */
describe("PATCH /:id/posts/:postId", function(){
    test("works - can update a group post", async function(){
        // get group
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id

        // get post
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id

        const resp = await request(app)
        .patch(`/groups/${group1Id}/posts/${postId}`)
        .send({text: "This post has been updated"})
        .set("authorization", `Bearer ${u3Token}`)

        expect(resp.statusCode).toBe(201)
        expect(resp.body).toHaveProperty('post')
        expect(resp.body.post).toHaveProperty('text', 'This post has been updated')
    })
    test("401 for other group member who tries to edit another member's post", async function(){
        // get group
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        
        // get post
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id
        
        const resp = await request(app)
        .patch(`/groups/${group1Id}/posts/${postId}`)
        .send({text: "This post has been updated"})
        .set("authorization", `Bearer ${u1Token}`)
        
        expect(resp.statusCode).toBe(401)
    })
    test("401 for user who isn't logged in", async function(){
        // get group
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
        
        // get post
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id
        
        const resp = await request(app)
        .patch(`/groups/${group1Id}/posts/${postId}`)
        .send({text: "This post has been updated"})
        
        expect(resp.statusCode).toBe(401)
    })
})

/************************************** DELETE /:id/posts/:postId */
describe("DELETE /:id/posts/:postId", function(){
    test("works - user can delete their own posts", async function(){
        // get group
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
                
        // get post
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id
                
        const resp = await request(app)
        .delete(`/groups/${group1Id}/posts/${postId}`)
        .set("authorization", `Bearer ${u3Token}`)
                
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({deleted: postId})
    })
    test("401 for other group members who try to delete the post", async function(){
         // get group
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
                        
        // get post
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id
                        
        const resp = await request(app)
        .delete(`/groups/${group1Id}/posts/${postId}`)
        .set("authorization", `Bearer ${u1Token}`)
                        
        expect(resp.statusCode).toBe(401)
    })
})

/************************************** POST /:id/posts/:postId/upvote*/
describe("POST /:id/posts/:postId/upvote", function(){
    test("works - any group member can upvote a post (including the original poster)", async function(){
        // get group
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
                                 
        // get post
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id
                                 
        const resp = await request(app)
        .post(`/groups/${group1Id}/posts/${postId}/upvote`)
        .set("authorization", `Bearer ${u1Token}`)
                                 
        expect(resp.statusCode).toBe(201)
        expect(resp.body).toHaveProperty('upvotes', 1)
    })
    test("401 for user who isn't logged in", async function(){
        // get group
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
                                      
        // get post
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id
                                      
        const resp = await request(app)
        .post(`/groups/${group1Id}/posts/${postId}/upvote`)
                                      
        expect(resp.statusCode).toBe(401) 
    })
})

/************************************** POST /:id/posts/:postId/downvote*/
describe("POST /:id/posts/:postId/downvote", function(){
    test("works - any group member can downvote a post (including the original poster)", async function(){
        // get group
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
                                 
        // get post
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id
                                 
        const resp = await request(app)
        .post(`/groups/${group1Id}/posts/${postId}/downvote`)
        .set("authorization", `Bearer ${u1Token}`)
                                 
        expect(resp.statusCode).toBe(201)
        expect(resp.body).toHaveProperty('downvotes', 1)
    })
    test("401 for user who isn't logged in", async function(){
        // get group
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const group1Id = result.rows[0].id
                                      
        // get post
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id
                                      
        const resp = await request(app)
        .post(`/groups/${group1Id}/posts/${postId}/downvote`)
                                      
        expect(resp.statusCode).toBe(401) 
    })
})