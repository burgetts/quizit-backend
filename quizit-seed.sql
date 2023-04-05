-- Seed user with one set of flashcards to start
INSERT INTO users
(username, password, first_name, email)
VALUES
('testuser', '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q', 'User', 'user@gmail.com'),
('testuser1', '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q', 'User1', 'user1@gmail.com');


-- testuser password is password

INSERT INTO sets
(name, description, created_by, side_one_name, side_two_name)
VALUES
('Amino Acids', 'The 20 amino acids', 'testuser', 'Structure', 'Name');

INSERT INTO flashcards
( side_one_text, side_two_text, side_one_image_url, set_id)
VALUES
('What is this AA?', 'Glycine', 'www.glycine-pic.jpg', 1);

INSERT INTO groups
(name, description, created_by)                                                                                                                                                                                         
VALUES                                                                                                                                                                                                      
('MCAT Study Group', 'A group for people who are taking the MCAT in March 2023', 'testuser');

INSERT INTO groups_members 
(member_username, group_id)
VALUES 
('testuser', 1);