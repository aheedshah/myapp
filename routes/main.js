//requiring bcrypt for my password encryption
const bcrypt = require("bcrypt");
const { check, validationResult, body} = require('express-validator');
const request = require("request");

module.exports = (app, shopData) => {
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('./login');
        } else {
            next();
        }
    }
    // Handle our routes
    //Our Home Page Route
    app.get('/', function (req, res) {
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

    /**
     * Form handler for register form
     * Register Form doesn't allow users to register unless their password is at least 8 characters and all the fields
     * have been entered correctly.
     * It also stores a hashed password to the db so that the passwords in our db are secure and sanitising all the fields
     * so they are safe from XSS attacks
     */
    app.post('/registered', [check('email').isEmail(), check('password').isLength({min: 8})], (req, res) => {
        //checking if the email is an email and the password has a length of at least 8 characters
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./register');
        } else {
            //The cost factor controls how much time is needed to calculate a single bcrypt hash
            const saltRounds = 10;
            //Sanitising the password the user enters
            const plainPassword = req.sanitize(req.body.password);
            //hashing the password
            bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
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
                    let newData = Object.assign({}, shopData, {registeredUser: newUser});
                    res.render("registered.ejs", newData);
                });
            });
        }
    });

    //Rendering login page
    app.get('/login', (req, res) => {
        //renders login page
        res.render('login.ejs', shopData);
    });

    /**
     * Form handler for login page
     * The login page uses compare from bcrypt to check if the password entered matches the hashed password.
     * It also sanitises all fields to protect from XSS Attacks.
     * */
    app.post('/loggedIn', (req, res) => {
        //Password the user enters
        const plainPassword = req.sanitize(req.body.password);
        //SQL Query to get the hashed password from the database
        let sqlQuery = "SELECT password FROM userDetails WHERE username='" + req.sanitize(req.body.username) + "'";

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
    app.get('/logout', redirectLogin, (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('./');
            }
            res.send('You have been logged out. <a href=' + './' + '>Home</a>');
        });
    });

    //Rendering add food page
    app.get('/add-food', redirectLogin, (req, res) => {
        res.render('add-food.ejs', shopData);
    });

    /***
     * Form handler to add food
     * This form handler adds food to our database including the user who added the food. It also sanitises each field
     * to protect from XSS Attacks
     */
    app.post('/food-added', (req, res) => {
        const username = req.session.userId; //getting the username to add it to the db
        //the sql query
        let sqlQuery = "INSERT INTO food(username, name, value, unit, carbs, fat, protein, salt, sugar) VALUES (?,?,?,?,?,?,?,?,?)";
        //Array of new things to populate the db with
        let newFood = [username, req.sanitize(req.body.name), req.sanitize(req.body.price), req.sanitize(req.body.unit),
            req.sanitize(req.body.carbs), req.sanitize(req.body.fat), req.sanitize(req.body.protein), req.sanitize(req.body.salt),
            req.sanitize(req.body.sugar)];

        //adding the food in our database
        db.query(sqlQuery, newFood, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            //rendering this to show details of the food added
            let newData = Object.assign({}, shopData, {foodAdded: newFood});
            res.render("food-added.ejs", newData);
        });
    });

    //Rendering the search food page
    app.get('/search-food', (req, res) => {
        res.render('search-food.ejs', shopData);
    });

    /***
     * Form handler to render search result of food
     * This checks if keyword is empty. If it is, it redirects to the previous page
     * This also sanitises the keyword which is being searched
     */
    app.get('/search-result', [check('keyword').notEmpty()], (req, res) => {
        //Checking to see that the keyword is not empty
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./search-food');
        } else {
            //searching in the database
            let sqlQuery = "SELECT * FROM food WHERE name LIKE '%" + req.sanitize(req.query["keyword"]) + "%'"; // query database to get all the books
            // execute sql query
            db.query(sqlQuery, (err, result) => {
                if (err) {
                    res.redirect('./');
                }
                //If there are no matching food found, send this to the page
                if (result[0] === undefined) {
                    res.send('No matching food has been found. Click <a href=' + '/search-food' + '>here</a> to go back to the search page or <a href=' + './' + '>here</a> to go back to the home page.');
                } else {
                    //get the available food from the db
                    let newData = Object.assign({}, shopData, {availableFood: result});
                    //and render the page with that data
                    res.render("list-food.ejs", newData);
                }
            });
        }
    });

    //Rendering the update food search page. This also redirects to login page if user hasn't logged in
    app.get('/search-food-to-update', redirectLogin, (req, res) => {
        res.render('search-food-to-update.ejs', shopData);
    });

    /**
     * Form handler to show table of food of search keyword.
     * This redirects to login page if user has not logged in and also checks to see whether the keyword is empty.
     * It also sanitises keyword to protect from XSS Attacks
     */
    app.get('/food-to-update', redirectLogin, [check('keyword').notEmpty()], (req, res) => {
        //Checking to see that the keyword is not empty
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./search-food-to-update');
        } else {
            //searching in the database
            let sqlQuery = "SELECT * FROM food WHERE name LIKE '%" + req.sanitize(req.query["keyword"]) + "%'"; // query database to get all the books
            // execute sql query
            db.query(sqlQuery, (err, result) => {
                if (err) {
                    res.redirect('./');
                } else if (result[0] === undefined) { //If there are no matching food found, send this to the page
                    res.send('No matching food has been found. Click <a href=' + '/search-food-to-update' + '>here</a> to go back to the search page or <a href=' + './' + '>here</a> to go back to the home page.');
                } else {
                    //get the available food from the db
                    let newData = Object.assign({}, shopData, {availableFood: result});
                    //and render the page with that data
                    res.render("list-food-to-update.ejs", newData);
                }
            });
        }
    });

    /**
     * Form handler to render update food form.
     * It populates the form using the data already in the database so that the user can see what they are updating.
     * It also checks if the user that has logged in is the same as the user who had added the data. If not, it throws
     * an error.
     * This redirects to login page if user has not logged in and also checks to see whether the keyword is empty.
     * It also sanitises keyword to protect from XSS Attacks.
     */
    app.get('/update-food', redirectLogin, [check('keyword').notEmpty()], (req, res) => {
        let username = req.session.userId;//getting the username
        //Checking to see that the keyword is not empty
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./search-food-to-update');
        } else {
            //searching in the database
            let sqlQuery = "SELECT * FROM food WHERE foodID = " + req.sanitize(req.query["keyword"]) + ""; // query database to get the exact food
            // execute sql query
            db.query(sqlQuery, (err, result) => {
                if (err) {
                    res.redirect('./');
                }
                //If there are no matching food found, send this to the page
                if (result[0] === undefined) {
                    res.send('Oops, something went wrong. Click  <a href=' + './' + '>here</a> to go back to the home page.');
                } else if (username !== result[0].username) { //if the user trying to access this page is different from the one who added this food item, send this:
                    res.send('The user does not match the user who added this food. Try again using the same credentials you used while adding this food. Click <a href=' + './' + '>here</a> to go back to the home page.');
                } else { //If everything checks out:
                    //get the available food from the db
                    let newData = Object.assign({}, shopData, {food: result});
                    //and render the page with that data
                    res.render("update-food-form.ejs", newData);
                }
            });
        }
    });


    /**
     * Form handler to update the data selected in the database
     * This form handler updates the data in the database with the new data entered by the user.
     * This redirects to login page if user has not logged in and also checks to see whether the keyword is empty.
     * It also sanitises keyword to protect from XSS Attacks.
     */
    app.post('/food-update', redirectLogin, [check('keyword').notEmpty()], (req, res) => {
        //check if there are no errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            //if there are errors, redirect to search page
            res.redirect('./search-food-to-update');
        } else {
            //SQL Query to update
            let sqlQuery = "UPDATE food SET name = ?, value = ?, unit = ?, carbs = ?, fat = ?, protein = ?, salt = ?, sugar = ? WHERE foodID = " + req.query["keyword"] + "";
            //Array of updated fields
            let updatedFood = [req.sanitize(req.body.name), req.sanitize(req.body.price), req.sanitize(req.body.unit),
                req.sanitize(req.body.carbs), req.sanitize(req.body.fat), req.sanitize(req.body.protein), req.sanitize(req.body.salt),
                req.sanitize(req.body.sugar)];

            db.query(sqlQuery, updatedFood, (err, result) => {
                if (err) {
                    return console.error(err.message);
                }
                //getting the data to render food added page
                let newData = Object.assign({}, shopData, {foodAdded: updatedFood});
                res.render("food-added.ejs", newData);
            });
        }
    });

    /**
     * Form handler to delete the data selected in the database
     * The form handler deleted the data in the database selected by the user.
     * This redirects to login page if user has not logged in and also checks to see whether the keyword is empty.
     * It also sanitises keyword to protect from XSS Attacks.
     * */
    app.post('/delete-food', redirectLogin, [check('keyword').notEmpty()], (req, res) => {
        //check if there are no errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            //if there are errors, redirect to this page
            res.redirect('./search-food-to-update');
        } else {
            //SQL Query to delete a specific food
            let sqlQuery = "DELETE FROM food  WHERE foodID = " + req.sanitize(req.query["keyword"]) + "";
            db.query(sqlQuery, (err, result) => {
                if (err) {
                    return console.error(err.message);
                }
                //Send this to the user's page upon successful deletion
                res.send('This food item has been successfully deleted. Click <a href=' + './' + '>here</a> to go back to the home page.');
            });
        }
    });

    //Page handler to show all food in our database
    app.get('/list-food', (req, res) => {
        let sqlQuery = "SELECT * FROM food"; // query database to get all the food
        // execute sql query
        db.query(sqlQuery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            //getting the data from the db and rendering the page with that
            let newData = Object.assign({}, shopData, {availableFood: result});
            res.render("list-food.ejs", newData);
        });
    });

    //Get API
    app.get('/api', (req, res) => {
        // Query database to get all the food items
        let sqlQuery = "SELECT * FROM food";
        if (req.query["keyword"]) {
            // Query database to get specific food if keyword present
            sqlQuery = "SELECT * FROM food WHERE name LIKE '%" + req.sanitize(req.query["keyword"]) + "%'";
        }
        // Execute the sql query
        db.query(sqlQuery, (err, result) => {
            if (err) {
                res.redirect('./');
            } else if (result[0] === undefined) {
                //If there is no result, send this to the user
                res.send('No food found matching the search criteria. Click on <a href=' + './' + '>Home</a> to go back to the homepage.');
            } else {
                // Return results as a JSON object
                res.json(result);
            }
        });
    });

    //Get specific food by API
    app.get('/api/:foodID', (req, res) =>  {
        //SQLQuery to delete the food item from the database
        let sqlQuery = "SELECT * FROM food WHERE foodID = " + req.sanitize(req.params.foodID) + "";
        db.query(sqlQuery, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            //If foodID has not been found
            if(result[0] === undefined) {
                //send this
                res.send('This food ID does not exist.');
            } else {
                //Send this to the user's page if foodID has been found
                res.json(result);
            }
        });
    });

    //API implementation of Delete
    app.delete('/api/:foodID', (req, res) => {
        //SQLQuery to delete the food item from the database
        let sqlQuery = "DELETE FROM food  WHERE foodID = " + req.sanitize(req.params.foodID) + "";
        db.query(sqlQuery, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            //If result has affected at least one row,
            if(result.affectedRows !== 0) {
                //Send this to the user's page upon successful deletion
                res.send('This food item has been successfully deleted.');
            } else {
                //If nothing has been deleted send this
                res.send('This food ID does not exist.');
            }
        });
    });

    //API Implementation to post a new food
    app.post('/api', (req, res) => {
        //the sql query to add the new food
        let sqlQuery = "INSERT INTO food(username, name, value, unit, carbs, fat, protein, salt, sugar) VALUES (?,?,?,?,?,?,?,?,?)";
        let newFood = [req.sanitize(req.body.username), req.sanitize(req.body.name), req.sanitize(req.body.value), req.sanitize(req.body.unit),
            req.sanitize(req.body.carbs), req.sanitize(req.body.fat), req.sanitize(req.body.protein), req.sanitize(req.body.salt),
            req.sanitize(req.body.sugar)];

        //Checking if all values are entered
        for(let i=0; i<newFood.length; i++) {
            if(newFood[i]===undefined) {
                //if any value is undefined, we return this error
                return res.send('You are missing a value. Please check the values and try again.')
            }
        }

        //adding the food in our database
        db.query(sqlQuery, newFood, (err, result) => {
            if (err) {
                return console.error(err.message);
            } else if(result.affectedRows !== 0) { //If the food has been added, we render this page
                let newData = Object.assign({}, shopData, {foodAdded: newFood});
                res.render("food-added.ejs", newData);
            } else {
                //TODO: Say what error it is
                return res.send('Error encountered while trying to add the food. Try again!');
            }
        });
    });

    //API Implementation to update a food
    app.patch('/api/:foodID', (req, res) => {
        let sqlQuery = "UPDATE food SET name=?, value=?, unit=?, carbs=?, fat=?, protein=?, salt=?, sugar=? where foodID=?";
        let record = [req.body.name, req.body.value, req.body.unit, req.body.carbs, req.body.fat, req.body.protein, req.body.salt, req.body.sugar, req.params.foodID];

        //Checking if all values are entered
        for(let i=0; i<record.length; i++) {
            if(record[i]===undefined) {
                //if any value is undefined, we return this error
                return res.send('You are missing a value. Please check the values and try again.')
            }
        }

        db.query(sqlQuery, record, (err, result) => {
            if (err) {
                console.log(err.message);
                res.redirect('./');
            } else if (result.affectedRows !== 0) {
                return res.send('The food has been successfully updated!');
            } else {
                let string = 'Error encountered while trying to update the food. Try again!' + err;
                return res.send(string);
            }
        });
    });
}