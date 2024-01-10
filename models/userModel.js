const mysql2 = require("mysql2");

const conn = mysql2.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "library"
});

function addUser(user_name, phno, password) {
    return new Promise((resolve,reject) => {
        const query = "INSERT IGNORE INTO users(name, phno, password) values(?, ?, ?)";
        conn.query(query,[user_name, phno, password],(error,results) => {
            if(error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

function getAllBooks() {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM books";
        conn.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results); // array of objects [{bookId: 10, bookName: Harry Potter, quantityAvailable: 21}, {}, {}]
            }
        });
    });
}

async function verifyUser(username, password) {
    try {
        const results = await new Promise((resolve,reject) => {
            const query = "SELECT 1 FROM users WHERE name = ? and password = ?";
            conn.query(query,[username, password],(error,results) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        if(results.length === 0) {
            return false;
        }
        return true;
    } catch(error) {
        console.log("Error verifying user:",error);
    }
}

// function to get all books of a user
function getUserBooks(user_name) {
    return new Promise((resolve,reject) => {
        const query = "SELECT bookName FROM user_books WHERE userName = ?";
        conn.query(query,[user_name],(error,results) => {
            if(error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// function to map book to the respective user
function userBooksMapping(user_name,book_name) {
    return new Promise((resolve,reject) => {
        const query = "insert into user_books(userName,bookName) values(?,?)";
        conn.query(query,[user_name,book_name],(error,results) => {
            if(error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// function to update book quantity in the database
function updateBookQuantity(book_name,toBorrow,toReturn) {
    return new Promise((resolve, reject) => {
        let query = "";
        if(toBorrow === true) {
            query = "UPDATE books SET quantityAvailable = quantityAvailable - 1 WHERE bookName = ?";
        } else if(toReturn === true) {
            query = "UPDATE books SET quantityAvailable = quantityAvailable + 1 WHERE bookName = ?";
        }
        conn.query(query, [book_name], (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// function to borrow book
async function borrowBook(user_name, borrowBookName) {
    try {
        const userBooks = await getUserBooks(user_name);
        const userHasBook = userBooks.find((book) => book.bookName === borrowBookName);
        if(userHasBook) {
            console.log(borrowBookName, "has already been lent to you");
            return;
        }

        const allBooks = await getAllBooks();

        const bookDetails = allBooks.find((book) => book.bookName === borrowBookName);

        if (!bookDetails) {
            console.log(borrowBookName, "is not available right now");
            return;
        }

        if (bookDetails.quantityAvailable <= 0) {
            console.log("Sorry, the book is currently out of stock.");
            return;
        }

        await userBooksMapping(user_name, borrowBookName);

        console.log("==========================================");
        console.log("You have successfully borrowed", borrowBookName);

        await updateBookQuantity(borrowBookName, true, false); // toBorrow,toReturn
    } catch (error) {
        console.error("Error borrowing a book:", error);
    }
}

// function to delete books after the user returns it
async function deleteUserBooksMapping(user_name, book_name) {
    console.log("mapping deleted for the user", user_name, "for the book", book_name);
    return new Promise((resolve,reject) => {
        const query = "DELETE FROM user_books WHERE userName = ? AND bookName = ?";
        conn.query(query,[user_name,book_name],(error,results) => {
            if(error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

async function returnBook(user_name, book_name) {
    try {
        // const isPresent = await verifyUserBookMapping(user_name,book_name);

        // if(!isPresent) {
        //     console.log("you don't have that book");
        //     return;
        // }

        await deleteUserBooksMapping(user_name,book_name);
        
        await updateBookQuantity(book_name,false,true); // isBorrow,isReturn

        console.log("thank you for returning",book_name);
    } catch(error) {
        console.error("Error returning book",error)
    }
}

module.exports = {
    addUser,
    getAllBooks,
    verifyUser,
    getUserBooks,
    borrowBook,
    returnBook,
    deleteUserBooksMapping
};