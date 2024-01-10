const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mysql2 = require('mysql2');

// CRUD
const { addUser, verifyUser, getAllBooks, getUserBooks, borrowBook, returnBook } = require("./models/userModel");

const conn = mysql2.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "library"
});

const PORT = 5000;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use("/assets", express.static("assets"));

app.get("/", async (req, res) => {
    const allBooks = await getAllBooks();
    const username = "session_user";
    const userBooks = [];
    const reload = false;
    res.render("home", {allBooks, username, userBooks, reload});
});

app.get("/register", (req, res) => {
    res.render("register");
});
// handling registration
app.post("/registeration", async (req, res) => {
    const username = req.body.username;
    const phno = req.body.phno;
    const password = req.body.password;
    // add values to the database
    // also check if the user already exists in the db
    await addUser(username, phno, password);
    // render the profile page
    res.render("profile", {username, phno});

});

app.get("/login", (req, res) => {
    const message = "";
    res.render("login", {message});
});
// handle login
app.post("/loginUser", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    let message = "";
    if(await verifyUser(username, password)) {
        const allBooks = await getAllBooks();
        // res.render("AllBooks", {username, allBooks});
        const userBooks = await getUserBooks(username);
        const reload = false;
        res.render("home", {username, allBooks, userBooks, reload});
    } else {
        message = "Incorrect username or password";
        res.render("login", {message});
    }
});

// app.get("/profile", async (req, res) => {
//     // await addUser(username, phno, password);
//     res.send("get the values from database");
//     // render the profile page
//     // await getUserBooks(username);
//     res.render("profile", {});
// });

app.get("/AllBooks", async (req, res) => {
    const allBooks = await getAllBooks();
    const username = "session_user";
    res.render("AllBooks", {allBooks, username});
});


app.post("/borrowBook", async (req, res) => {
    const username = req.body.username;
    const borrowBookName = req.body.bookName;
    const reload = true;
    await borrowBook(username, borrowBookName, reload);
});

app.post("/returnBook", async (req, res) => {
    const username = req.body.username;
    const bookname = req.body.bookname;
    await returnBook(username, bookname);
});

app.listen(PORT, () => {
    console.log(`server is listening at port ${PORT}`)
});