
\echo 'Delete and recreate quizit db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE quizit;
CREATE DATABASE quizit;
\connect quizit

\i quizit-schema.sql
\i quizit-seed.sql

\echo 'Delete and recreate quizit_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE quizit_test;
CREATE DATABASE quizit_test;
\connect quizit_test

\i quizit-schema.sql