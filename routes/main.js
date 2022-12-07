//requiring bcrypt for my password encryption
const bcrypt = require("bcrypt");
const { check, validationResult } = require('express-validator');
const request = require("request");

module.exports = (app, shopData) => {
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId ) {
            res.redirect('./login')
        } else {
            next();
        }
    }
    // Handle our routes
    //Our Home Page Route
    app.get('/',function(req,res) {
        res.render('index.ejs', shopData);
    });

    //About page route
    app.get('/about', (req, res) => {
        res.render('about.ejs', shopData);
    });

    //Register Page Route
    app.get('/register', (req, res) => {
        res.render('register.ejs', shopData);
    });

    //From handler for register form
    app.post('/registered', [check('email').isEmail(), check('password').isLength({min: 8})], (req,res) => {
        //checking if the email is an email and the password has a length of at least 8 characters
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            res.redirect('./register');
        } else {
            //The cost factor controls how much time is needed to calculate a single bcrypt hash
            const saltRounds = 10;
            //Sanitising the password the user enters
            const plainPassword = req.sanitize(req.body.password);
            //hashing the password
            bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
                // Storing hashed password in the database.
                let sqlQuery = "INSERT INTO userDetails (first, last, email, username, password) VALUES (?,?,?,?,?)";

                // execute sql query
                let newUser = [req.sanitize(req.body.first), req.sanitize(req.body.last), req.sanitize(req.body.email),
                    req.sanitize(req.body.username), hashedPassword, req.sanitize(plainPassword)];

                //adding the user in our database
                db.query(sqlQuery, newUser, (err, result) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    //rendering this to the registered page
                    let newData = Object.assign({}, shopData, {registeredUser:newUser});
                    res.render("registered.ejs", newData);
                });
            });
        }
    });

    //Login page handlers
    app.get('/login', (req,res) => {
        //renders login page
        res.render('login.ejs', shopData);
    });

    //Login page form handler
    app.post('/loggedIn', (req, res) => {
        //Password the user enters
        const plainPassword = req.sanitize(req.body.password);
        //SQL Query to get the hashed password from the database
        let sqlQuery = "SELECT password FROM userDetails WHERE username='"+req.sanitize(req.body.username)+"'";

        //Querying the db
        db.query(sqlQuery, (err, result) => {
            if (err) {
                return console.log(err.message);
            } else if (result[0] === undefined) {
                res.render('wrong-details.ejs', shopData);
            } else {
                //hashed password from the database
                let hashedPassword = result[0].password;

                //Compares the hashed password in the database with the password user enters using the same key
                bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
                    if (err) {
                        return console.error(err.message);
                    } else if (result === true) { //if we could find a user with the same username and pwd in the db
                        // Save user session here, when login is successful
                        req.session.userId = req.sanitize(req.body.username);
                        res.render('loggedIn.ejs', shopData);
                    } else { //else we go to the wrong details page
                        res.render('wrong-details.ejs', shopData);
                    }
                });
            }
        });
    });

    //Logout Page Handler
    app.get('/logout', redirectLogin, (req,res) => {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('./')
            }
            res.send('You have been logged out. <a href='+'./'+'>Home</a>');
        });
    });

    //Rendering add food page
    app.get('/add-food', redirectLogin, (req, res) => {
        res.render('add-food.ejs', shopData);
    });

    //Form handler to add food
    app.post('/food-added', (req, res) => {
        const username = req.session.userId;
        let sqlQuery = "INSERT INTO food(username, name, value, unit, carbs, fat, protein, salt, sugar) VALUES (?,?,?,?,?,?,?,?,?)";
        let newFood = [username, req.sanitize(req.body.name), req.sanitize(req.body.price), req.sanitize(req.body.unit),
            req.sanitize(req.body.carbs), req.sanitize(req.body.fat), req.sanitize(req.body.protein), req.sanitize(req.body.salt),
            req.sanitize(req.body.sugar)];

        //adding the user in our database
        db.query(sqlQuery, newFood, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            //rendering this to the registered page
            let newData = Object.assign({}, shopData, {foodAdded:newFood});
            res.render("food-added.ejs", newData);
        });
    });

    app.get('/search-food', (req, res) => {
       res.render('search-food.ejs', shopData);
    });

    app.get('/search-result', [check('keyword').notEmpty()], (req, res) => {
        //Checking to see that the keyword is not empty
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            res.redirect('./search-food');
        } else {
            //searching in the database
            let sqlQuery = "SELECT * FROM food WHERE name LIKE '%" + req.query["keyword"] + "%'"; // query database to get all the books
            // execute sql query
            db.query(sqlQuery, (err, result) => {
                if (err) {
                    res.redirect('./');
                }
                //If there are no matching food found, send this to the page
                if(result[0] === undefined) {
                    res.send('No matching food has been found. Click <a href='+'/search-food'+'>here</a> to go back to the search page or <a href='+'./'+'>here</a> to go back to the home page.');
                } else {
                    //get the available food from the db
                    let newData = Object.assign({}, shopData, {availableFood:result});
                    //and render the page with that data
                    res.render("list-food.ejs", newData);
                }
            });
        }
    });

    app.get('/list-food', (req, res) => {
        let sqlQuery = "SELECT * FROM food"; // query database to get all the food
        // execute sql query
        db.query(sqlQuery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            //getting the data from the db and rendering the page with that
            let newData = Object.assign({}, shopData, {availableFood:result});
            res.render("list-food.ejs", newData)
        });
    });

    app.get('/api', (req, res) => {
        // Query database to get all the food items
        let sqlQuery = "SELECT * FROM food";
        if(req.query["keyword"]) {
            // Query database to get specific food
            sqlQuery = "SELECT * FROM food WHERE name LIKE '%" + req.sanitize(req.query["keyword"]) + "%'";
        }
        // Execute the sql query
        db.query(sqlQuery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            if (result[0] === undefined) {
                res.send('No food found matching the search criteria. Click on <a href='+'./'+'>Home</a> to go back to the homepage.');
            } else {
                // Return results as a JSON object
                res.json(result);
            }
        });
    })

    //Update food Reqs:
    // SQL Query: UPDATE food SET name = ?, carbs = ? etc WHERE food ID = x;



    // //Delete User page handler
    // app.get('/deleteUser', redirectLogin, (req, res) => {
    //     res.render('deleteUser.ejs', shopData);
    // });
    // //Delete account handler
    // app.post('/deleteAccount', [check('username').notEmpty()], (req, res) => {
    //     //This checks if the input for the account which is to be deleted is not empty
    //     const errors = validationResult(req);
    //     if(!errors.isEmpty()) {
    //         res.redirect('./deleteUser');
    //     } else {
    //         //Gets the username from the form
    //         const username = req.sanitize(req.body.username);
    //         //SQL Query to delete the user from the db
    //         let sqlQuery = "DELETE FROM userDetails WHERE username='" + username + "'";
    //
    //         //Executing the query
    //         db.query(sqlQuery, (err, result) => {
    //             if (err) {
    //                 return console.log("Error on the deleteUser path: ", err);
    //             }
    //             //If the user didn't exist in the db, send a different message to the user
    //             if (result.affectedRows === 0) {
    //                 res.send("The user doesn't exist. Try again");
    //             } else {
    //                 res.send('The User '+ req.sanitize(req.body.username)+' has been deleted. Click on <a href='+'./'+'>Home</a> to go back to the homepage');
    //             }
    //         });
    //     }
    // });
    // //the about page handler
    // app.get('/about',(req,res) => {
    //     res.render('about.ejs', shopData);
    // });
    // //the search page handler
    // app.get('/search', redirectLogin, (req,res) => {
    //     res.render("search.ejs", shopData);
    // });
    // //the search result form handler
    // app.get('/search-result', [check('keyword').notEmpty()], (req, res) => {
    //     const errors = validationResult(req);
    //     if(!errors.isEmpty()) {
    //         res.redirect('./search');
    //     } else {
    //         //searching in the database
    //         let sqlQuery = "SELECT * FROM books WHERE name LIKE '%" + req.query["keyword"] + "%'"; // query database to get all the books
    //         // execute sql query
    //         db.query(sqlQuery, (err, result) => {
    //             if (err) {
    //                 res.redirect('./');
    //             }
    //             //get the available books from the db
    //             let newData = Object.assign({}, shopData, {availableBooks:result});
    //             //and render the page with that data
    //             res.render("list.ejs", newData);
    //         });
    //     }
    // });
    // //register page handler
    // app.get('/register', (req,res) => {
    //     res.render('register.ejs', shopData);
    // });
    // //registered form page handler
    // app.post('/registered', [check('email').isEmail(), check('password').isLength({min: 8})], (req,res) => {
    //     //checking if the email is an email and the password has a length of at least 8 characters
    //     const errors = validationResult(req);
    //     if(!errors.isEmpty()) {
    //         res.redirect('./register');
    //     } else {
    //         //The cost factor controls how much time is needed to calculate a single bcrypt hash
    //         const saltRounds = 10;
    //         //Sanitising the password the user enters
    //         const plainPassword = req.sanitize(req.body.password);
    //         //hashing the password
    //         bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
    //             // Storing hashed password in the database.
    //             let sqlQuery = "INSERT INTO userDetails (first, last, email, username, password) VALUES (?,?,?,?,?)";
    //
    //             // execute sql query
    //             let newUser = [req.sanitize(req.body.first), req.sanitize(req.body.last), req.sanitize(req.body.email),
    //                 req.sanitize(req.body.username), hashedPassword, req.sanitize(plainPassword)];
    //
    //             //adding the user in our database
    //             db.query(sqlQuery, newUser, (err, result) => {
    //                 if (err) {
    //                     return console.error(err.message);
    //                 }
    //                 //rendering this to the registered page
    //                 let newData = Object.assign({}, shopData, {registeredUser:newUser});
    //                 res.render("registered.ejs", newData);
    //             });
    //         });
    //     }
    // });
    // //the list page handler
    // app.get('/list', redirectLogin, (req, res) => {
    //     let sqlQuery = "SELECT * FROM books"; // query database to get all the books
    //     // execute sql query
    //     db.query(sqlQuery, (err, result) => {
    //         if (err) {
    //             res.redirect('./');
    //         }
    //         //getting the data from the db and rendering the page with that
    //         let newData = Object.assign({}, shopData, {availableBooks:result});
    //         res.render("list.ejs", newData)
    //      });
    // });
    // //listUsers page handler
    // app.get('/listUsers', redirectLogin, (req, res) => {
    //     //get the related columns from the db
    //     let sqlQuery = "SELECT first, last, email, username FROM userDetails";
    //     //querying the db
    //     db.query(sqlQuery, (err, result) => {
    //         if(err) {
    //             return console.log("Error on listUsers route ", err.message);
    //         }
    //         //getting the users from the db and rendering them
    //         let newData = Object.assign({}, shopData, {availableUsers:result});
    //         res.render("listUsers.ejs", newData)
    //     })
    // });
    //
    // //addBooks page handler
    // app.get('/addbook', redirectLogin, (req, res) => {
    //     //rendering addbook.ejs
    //     res.render('addbook.ejs', shopData);
    // });
    //
    // //bookAdded page handler
    // app.post('/bookadded', [check('name').isAlphanumeric(), check('price').isNumeric()], (req,res) => {
    //     //Checking if the name of book is alphanumeric and the price is numeric
    //     const errors = validationResult(req);
    //     if(!errors.isEmpty()) {
    //         res.redirect('./addbook');
    //     } else {
    //         // saving data in database
    //         let sqlQuery = "INSERT INTO books (name, price) VALUES (?,?)"
    //         // execute sql query
    //         let newRecord = [req.sanitize(req.body.name), req.sanitize(req.body.price)];
    //         db.query(sqlQuery, newRecord, (err, result) => {
    //             if (err) {
    //                 return console.error(err.message);
    //             } else
    //                 res.send('This book is added to database, name: ' + req.sanitize(req.body.name) +
    //                     ' price ' + req.sanitize(req.body.price) + '. Click on <a href='+'./'+'>Home</a> to go back to the homepage');
    //         });
    //     }
    // });
    //
    // //bargainBooks page handler
    // app.get('/bargainbooks', redirectLogin, (req, res) => {
    //     //SQL Query to get the bargain books(i.e. books whose price is lesser than 20)
    //     let sqlQuery = "SELECT * FROM books WHERE price < 20";
    //     //Querying the db
    //     db.query(sqlQuery, (err, result) => {
    //       if (err) {
    //          res.redirect('./');
    //       }
    //       //Getting the books and rendering them
    //       let newData = Object.assign({}, shopData, {availableBooks:result});
    //       res.render("bargains.ejs", newData)
    //     });
    // });
    //
    //
    // //Handler to show the weather form
    // app.get('/weather', (req, res) => {
    //     res.render('weather.ejs', shopData);
    // });
    //
    // //Weather result showing handler
    // app.get('/weather-result', (req, res) => {
    //     const request = require('request');
    //     let apiKey = "fa4f97247d32a457d8f3c40e62d383a7";
    //     let city = req.sanitize(req.query["keyword"]);
    //     let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    //
    //     request(url, (err, response, body) => {
    //         if(err) {
    //             console.log('error:', error);
    //         } else {
    //             const weather = JSON.parse(body);
    //             if (weather!==undefined && weather.main!==undefined) {
    //                 let newData = Object.assign({}, shopData, {theWeather:weather});
    //                 res.render('weatherResult.ejs', newData);
    //             } else {
    //                 res.redirect('/weather');
    //             }
    //         }
    //     });
    // });
    //
    // //API route handler
    // app.get('/api', (req, res) => {
    //     // Query database to get all the books
    //     let sqlQuery = "SELECT * FROM books";
    //     if(req.query["keyword"]) {
    //         // Query database to get specific books
    //         sqlQuery = "SELECT * FROM books WHERE name LIKE '%" + req.sanitize(req.query["keyword"]) + "%'";
    //     }
    //     // Execute the sql query
    //     db.query(sqlQuery, (err, result) => {
    //         if (err) {
    //             res.redirect('./');
    //         }
    //         if (result[0] === undefined) {
    //             res.send('No books found matching the search criteria. Click on <a href='+'./'+'>Home</a> to go back to the homepage.');
    //         } else {
    //             // Return results as a JSON object
    //             res.json(result);
    //         }
    //     });
    // });
    //
    // //Rendering TV Shows file
    // app.get('/tvshows', (req, res) => {
    //     res.render('tvshows.ejs', shopData);
    // });
    //
    // //Searching for TV Shows
    // app.get('/show-search', (req, res) => {
    //     let query = req.sanitize(req.query["keyword"]);
    //     let url = `https://api.tvmaze.com/search/shows?q=${query}`;
    //     request(url, (err, response, body) => {
    //         if(err) {
    //             console.log('error:', error);
    //         } else {
    //             const data = JSON.parse(body);
    //             if (data!==undefined && data[0]!==undefined) {
    //                 let newData = Object.assign({}, shopData, {theData:data});
    //                 res.render('tvshows-result.ejs', newData);
    //             } else {
    //                 res.redirect('/tvshows');
    //             }
    //         }
    //     });
    // });
}
