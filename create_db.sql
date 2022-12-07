CREATE DATABASE myRecipeBuddy;
USE myRecipeBuddy;

CREATE TABLE userDetails (userID INT AUTO_INCREMENT, first CHAR(50) NOT NULL, last CHAR(50), email VARCHAR(60) NOT NULL, username VARCHAR(50) NOT NULL, password VARCHAR(60) NOT NULL, PRIMARY KEY(userID));
CREATE TABLE food (foodID INT AUTO_INCREMENT, username CHAR(50) NOT NULL, name CHAR(50) NOT NULL, value CHAR(50) NOT NULL, unit CHAR(50) NOT NULL, carbs double(50, 2) NOT NULL, fat double(50, 2) NOT NULL, protein double(50, 2) NOT NULL, salt double(50, 2) NOT NULL, sugar double(50, 2) NOT NULL, PRIMARY KEY(foodID));
SELECT * FROM food;

CREATE USER 'appusers'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2027';
GRANT ALL PRIVILEGES ON myRecipeBuddy.* TO 'appusers'@'localhost';