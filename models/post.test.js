"use strict";

const {
    NotFoundError
  } = require("../expressError");

const db = require("../db.js");
const app = require("../app");
const Post = require("../models/post");

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

/************************************** getReplies */
describe("getReplies", function(){
    test("works - get post replies", async function(){
        const result = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const id = result.rows[0].id
        const replies = await Post.getReplies(id)
        expect(replies).toEqual([{
            text: 'First reply',
            postedBy: 'u1',
            id: expect.any(Number),
            upvotes: 0,
            downvotes: 0,
            replyTo: id,
            datePosted: expect.any(Date)
        }])
    })
})

/************************************** add */
describe("add", function(){
    test("works - add a post", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id
        const newPostData = {text: 'A post for testing', postedBy: 'u1', groupId: groupId}
        const newPost = await Post.add(newPostData)
        expect(newPost).toEqual({
            ...newPostData,
            upvotes: 0,
            downvotes: 0,
            id: expect.any(Number),
            datePosted: expect.any(Date),
            replyTo: null
        })
    })
    test("works - add a reply", async function(){
        const result = await db.query(`SELECT id FROM groups WHERE name='Group1'`)
        const groupId = result.rows[0].id

        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id

        const newPostData = {text: 'A post for testing', postedBy: 'u1', groupId: groupId, replyTo: postId}
        const newPost = await Post.add(newPostData)
        expect(newPost).toEqual({
            ...newPostData,
            upvotes: 0,
            downvotes: 0,
            id: expect.any(Number),
            datePosted: expect.any(Date),
            replyTo: postId
        })
    })
})

/************************************** edit */
describe("update", function(){
    test("works - update a post", async function(){
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id

        const updatedPost = await Post.update(postId, 'Now it says this')

        expect(updatedPost).toEqual({
            id: expect.any(Number),
            text: 'Now it says this',
            groupId: expect.any(Number),
            replyTo: null,
            upvotes: 0, 
            downvotes: 0,
            datePosted: expect.any(Date),
            postedBy: 'u3'
        })
    })
    test("works - update a reply", async function(){
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='First reply'`)
        const replyId = result1.rows[0].id

        const updatedReply = await Post.update(replyId, 'Now it says this')
        expect(updatedReply).toEqual({
            id: expect.any(Number),
            text: 'Now it says this',
            groupId: expect.any(Number),
            replyTo: expect.any(Number),
            upvotes: 0, 
            downvotes: 0,
            datePosted: expect.any(Date),
            postedBy: 'u1'
        })
    })
})

/************************************** delete */
describe("delete", function(){
    test("works - can delete a post", async function(){
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id

        const deletedPost = await Post.delete(postId)
        expect(deletedPost).toEqual({deleted: postId})
    })
    test("works - can delete a reply", async function(){
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='First reply'`)
        const replyId = result1.rows[0].id

        const deletedReply = await Post.delete(replyId)
        expect(deletedReply).toEqual({deleted: replyId})
    })
})

/************************************** upvote */
describe("upvote", function(){
    test("works - can upvote a post", async function(){
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id

        const upvote = await Post.upvote(postId)
        expect(upvote).toEqual({upvotes: 1})
    })
    test("works - can upvote a reply", async function(){
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='First reply'`)
        const postId = result1.rows[0].id

        const upvote = await Post.upvote(postId)
        expect(upvote).toEqual({upvotes: 1})
    })
})

/************************************** downvote */
describe("downvote", function(){
    test("works - can downvote a post", async function(){
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='Post content'`)
        const postId = result1.rows[0].id

        const downvote = await Post.downvote(postId)
        expect(downvote).toEqual({downvotes: 1})
    })
    test("works - can downvote a reply", async function(){
        const result1 = await db.query(`SELECT id FROM group_posts WHERE text='First reply'`)
        const postId = result1.rows[0].id

        const downvote = await Post.downvote(postId)
        expect(downvote).toEqual({downvotes: 1})
    })
})