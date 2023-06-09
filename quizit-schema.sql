CREATE TABLE "sets" (
  "id" INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "name" VARCHAR(50) NOT NULL, 
  "description" VARCHAR(100) NOT NULL,
  "side_one_name" VARCHAR(25) NOT NULL,
  "side_two_name" VARCHAR(25) NOT NULL,
  "created_by" VARCHAR NOT NULL,
  "date_created" DATE NOT NULL DEFAULT CURRENT_DATE,
  "hidden" BOOLEAN NOT NULL DEFAULT FALSE 
);

CREATE TABLE "flashcards" (
  "id" INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "side_one_text" VARCHAR DEFAULT '',
  "side_two_text" VARCHAR DEFAULT '',
  "side_one_image_url" VARCHAR DEFAULT '',
  "side_two_image_url" VARCHAR DEFAULT '',
  "set_id" INT NOT NULL
  CONSTRAINT must_contain_text_or_image_side_one CHECK 
  ((flashcards.side_one_text IS NOT NULL) OR (flashcards.side_one_image_url IS NOT NULL))
  CONSTRAINT must_contain_text_or_image_side_two CHECK
  ((flashcards.side_two_text IS NOT NULL) OR (flashcards.side_two_image_url IS NOT NULL))
);

CREATE TABLE "groups" (
  "id" INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "name" VARCHAR(50) NOT NULL,
  "description" VARCHAR(100) NOT NULL,
  "group_picture" VARCHAR DEFAULT 'https://geodash.gov.bd/uploaded/people_group/default_group.png',
  "created_by" VARCHAR NOT NULL
);

CREATE TABLE "groups_sets" (
  "set_id" INT,
  "group_id" INT,
  PRIMARY KEY ("set_id", "group_id")
);

CREATE TABLE "users" (
  "username" VARCHAR(20) PRIMARY KEY,
  "password" VARCHAR NOT NULL,
  "first_name" VARCHAR(20) NOT NULL,
  "email" VARCHAR NOT NULL UNIQUE CHECK (position('@' IN email) > 1), 
  "account_created" DATE DEFAULT CURRENT_DATE,
  "profile_picture" VARCHAR DEFAULT 'https://spng.pngfind.com/pngs/s/676-6764065_default-profile-picture-transparent-hd-png-download.png'
);

CREATE TABLE "groups_members" (
  "member_username" VARCHAR NOT NULL,
  "group_id" INT NOT NULL,
  PRIMARY KEY ("member_username", "group_id")
);

CREATE TABLE "flashcard_comments" (
  "id" INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "text" VARCHAR NOT NULL,
  "posted_by" VARCHAR NOT NULL,
  "date_posted" DATE NOT NULL DEFAULT CURRENT_DATE,
  "flashcard_id" INT NOT NULL,
  "reply_to" INT,
  "upvotes" INT NOT NULL DEFAULT 0,
  "downvotes" INT NOT NULL DEFAULT 0
);

CREATE TABLE "group_posts" (
  "id" INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "text" VARCHAR NOT NULL,
  "posted_by" VARCHAR NOT NULL,
  "date_posted" DATE NOT NULL DEFAULT CURRENT_DATE,
  "group_id" INT NOT NULL,
  "reply_to" INT,
  "upvotes" INT NOT NULL DEFAULT 0,
  "downvotes" INT NOT NULL DEFAULT 0
);

ALTER TABLE "flashcards" ADD FOREIGN KEY ("set_id") REFERENCES "sets" ("id") ON DELETE CASCADE;

ALTER TABLE "sets" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("username") ON DELETE CASCADE;

ALTER TABLE "groups" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("username") ON DELETE CASCADE;

ALTER TABLE "flashcard_comments" ADD FOREIGN KEY ("flashcard_id") REFERENCES "flashcards" ("id") ON DELETE CASCADE;

ALTER TABLE "flashcard_comments" ADD FOREIGN KEY ("posted_by") REFERENCES "users" ("username") ON DELETE CASCADE;

ALTER TABLE "group_posts" ADD FOREIGN KEY ("posted_by") REFERENCES "users" ("username") ON DELETE CASCADE;

ALTER TABLE "groups_members" ADD FOREIGN KEY ("member_username") REFERENCES "users" ("username") ON DELETE CASCADE;

ALTER TABLE "groups_sets" ADD FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE;

ALTER TABLE "groups_members" ADD FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE;

ALTER TABLE "group_posts" ADD FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE;

ALTER TABLE "group_posts" ADD FOREIGN KEY ("reply_to") REFERENCES "group_posts" ("id") ON DELETE CASCADE;

ALTER TABLE "flashcard_comments" ADD FOREIGN KEY ("reply_to") REFERENCES "flashcard_comments" ("id") ON DELETE CASCADE;
