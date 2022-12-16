# Recipe Buddy
[GitHub link](https://www.github.com/aheedshah/myapp)

[Application link](https://doc.gold.ac.uk/usr/134)

This is a dynamic web application  which interacts with users to calculate and display nutritional facts for their recipes 
or meals based on food ingredients in the recipe or the meal. 

Solving each requirement of this app were my work and this was done completely by me

Below are each requirement solved as well the filenames and the line numbers of each requirement:

## Requirement 1 (Homepage)

The index.ejs file displays the name of the web application which is our home route `/` and also displays links to other 
pages included in this application.

## Requirement 2 (About page)

The about page on the route `/about` renders the page _about.ejs_ which displays information about the web application as well 
as my name. It also displays a link embedded in the shop name to redirect back to the home page.

## Requirement 3 (Register Page)

**R3A:** The form on the page _register.ejs_ is rendered using the route `/register` in main.js. Line number: 26-28.

**R3B:** The form data is collected from the form and is used on the `/registered` route in main.js (Line number: 37-67).
The form data includes the fields: First Name, Last Name, Email, Username and Password. A hashedPassword is also stored in the 
database rather than the original password to safeguard the user's password.

**R3C:** A message is rendered upon successful registration of a new user. The file `registered.ejs` is rendered through
line 63 on main.js. This file sends the details of the user registered to the screen.

**Going beyond what's asked by doing these tasks additionally:** 
* The route `/registered` redirects the user to the `/register` route if the data is either invalid (e.g. wrong email) or 
if the password is lesser than 8 characters.
* HTML has also been used to mark each file as required so none of them can be null.
* Additionally, all fields have been sanitised to protect this application from XSS attacks and

## Requirement 4 (Login Page)
**R4A:** The form on the page _login.ejs_ is rendered using the route `/login` in main.js. Line number: 70-73. This consists
of the username and password field and also contains link embedded in the shop name to return back to the home page.

**R4B:** The form on the page _login.ejs_ is sent to the route `/loggedIn` in main.js (Line number: 80-110) which checks 
the username and password entered with the data in the database. `bcrypt.compare` is used to check if the password entered
matches the hashedPassword and users are loggedIn if and only if both these fields are correct.

**R4C:** A message is rendered on the `loggedIn.ejs` page through line 103 in main.js when a user logs in successfully.

**Going beyond what's asked by doing these tasks additionally:**
* All the fields in the form are sanitised to protect from XSS Attacks.

## Requirement 5 (Logout Page)
The logout route doesn't have a page but only a route on main.js lines 113-120. Upon successfully logging out, the user 
gets displayed a message from where they can return back to the homepage.

## Requirement 6 (Add Food Page)
This form is only available to users who are logged in.

**R6A:** A form to add food is displayed to users through the `/add-food` route which renders the `add-food.ejs` page.
This page contains a form which contains the following fields: 

_Name:_ The name of the food. This can contain any characters.

_Typical Values per:_ The value per unit of value of the food being added. This can only be a number.

_Unit of value:_ Unit of typical values e.g. gram, litre, etc. This can be any word as there are a variety of typical values which can be used.

_Carbs:_ The amount of carbs in this food item per unit of value. This can only be a number. 

_Fat:_ The amount of carbs in this food item per unit of value. This can only be a number.

_Protein:_ The amount of carbs in this food item per unit of value. This can only be a number.

_Salt:_ The amount of carbs in this food item per unit of value. This can only be a number.

_Sugar:_ The amount of carbs in this food item per unit of value. This can only be a number. 

This field also contains a link embedded in the shop name to return to the home page

**R6B:** 
The form data is then collected and sent to the route `/food-added` (Page numbers: 132-150) which stores this data in the database. 

**R6C:** Upon successful addition to the database, the route `/food-added` renders the page `food-added.ejs` which displays all the data
of the food item added.

**Going beyond what's asked by doing these tasks additionally:**
* The username of the user who adds the food is being saved in the database which is used in the future requirements.
This can be seen on the `/food-added` route lines 132-150.
* All fields in the `/add-food` form are sanitised and hence protected from XSS Attacks.

## Requirement 7 (Search Food Page)
**R7A:** The route `/search-food` (line 153-155) renders the page `search-food.ejs` which displays a form with only one field: name of food item to search.
This also contains a link embedded in the shop name to return to the home page.

**R7B:** The searched keyword is then used in the `search-result` route to get the food items related to the search item. 
When the food is found, the file `list-food.ejs` renders a tabular data of the food which was searched which includes all the
data related to it. If no food is found related to the search, a message is sent to the user to search again or return to the home page.

**R7C:** Search keyword can contain _any_ part of the food name. E.g. searching for bread should return data of 'pitta bread' or 'white bread', etc.

**Going beyond what's asked by doing these tasks additionally:**
* Any part of the food can be searched and the search result will be related to the searched keyword.
* The searched keyword can not be empty and this is done using HTML's `required` in the `search-food.ejs` form (line 14). This
is also done additionally on the main.js route on line 162.

## Requirement 8 (Update Food Page)

This page is only available to users who are logged in.

**R8A:** The page `search-food-to-update.ejs` renders a form on the route `search-food-to-update` (Line 189-192) which allows users to search for a food item.
This contains only one field: name. This page also contains a link embedded in the shop name to go back to the homepage.

**R8B:** The form redirects to the route `/food-to-update` in main.js (Lines 198-220) which shows a table of food with a _select_ link on the rightmost
column for each food item. Selecting a food item opens a form pre-filled with the data already on the database. The user can then update any field
of the food item. The update food item route is implemented on the route `/food-update` on lines 230-257. 
Only the users who created the same food item are allowed to update the food item. The user is otherwise shown a page
which says the user doesn't match the user who added the food. 

**R8C:** A delete button is shown just below update button which allows the user who created the food item to delete it.
For good practice, _Are you sure you want to delete this?_ pop up shows when trying to delete an entry.

**Going beyond what's asked by doing these tasks additionally:**
* Only the users who created the same food item are allowed to update/delete the item.
* A pop-up to confirm deletion is used for good practice.
* All the routes used for this requirement in main.js (`/search-food-to-update`, `/food-to-update`, `/update-food`, `/food-update`, `/delete-food`) checks to see that the keyword is not empty as
well as if the user is logged in.
* All forms used are also sanitised to protect from XSS attacks.

## Requirement 9 (List Food Page)
**R9A:** This page `/list-food` shows each food currently in the database. This is all done in the `list-food.ejs` file.

**R9B:** This page shows each food in a tabular form with each nutritional information along with it.

**R9C:**
**Going beyond what's asked by doing these tasks additionally:**
* By clicking on each checkbox, the quantity textbox opens for editing. You can add numbers to it and find the nutritional information 
of the recipe you would like to develop.
* All these fields are validated and you can't have negative quantities in the fields.
* JavaScript is used to add these and put the addition in the bottom most row of the table
which makes it easier to see rather than sending the user to a different page. Line numbers: 73-115 in `list-food.ejs`
* All these APIs also have sanitisation done to protect from XSS attacks.

## Requirement 10 (API)
The APIs are done all in the `main.js` file in JSON format. You can navigate to it from the front-end as well by clicking API.

**Going beyond what's asked by doing these tasks additionally:**
* API implements get, post, push and delete. These are done in the `main.js` file from Line Numbers: 331-445.
* All these API have validation and if any value is undefined, it sends a message to the front-end.
* All these APIs also have sanitisation done to protect from XSS attacks.

## Requirement 11 (Form Validation)
Each form is validated using different techniques, and it has been noted through each requirement. A mix of HTML and JS is used
in this validation and can be found on the _Going beyond_ section of each requirement.

## Requirement 12 (My application)
This dynamic web app is implemented in node.js and run on my virtual server on [this link](https://doc.gold.ac.uk/usr/134).
Comments have been added everywhere necessary to understand the code. This Dynamic Web Application also uses MySQL as its database. 
The GitHub link of this project can be found on [this link](https://www.github.com/aheedshah/myapp).