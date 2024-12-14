const express = require('express');
const mysql = require('mysql2/promise'); // Use mysql2/promise directly
const cors = require('cors');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

const path = require('path');

// Serve frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Default route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Generate Access Token Function
const generateAccessToken = (payload) => {
    const secretKey = "your_secret_key";
    return jwt.sign(payload, secretKey, { expiresIn: "1h" });
};

// MySQL connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'sealSPACE96',
    database: 'event_reservation',
    connectionLimit: 10,  // Limit of 10 concurrent connections
});

// Test the connection
db.query('SELECT 1 + 1 AS solution')
    .then(([rows, fields]) => {
        console.log('Database connection is working:', rows);
    })
    .catch(err => {
        console.error('Error with the database connection:', err);
    });

// API route to get events
app.get('/events', async (req, res) => {
    const category = req.query.category; // Capture the category from the query parameter

    let query = 'SELECT * FROM events';
    const params = [];

    if (category) {
        query += ' WHERE category = ?';
        params.push(category);
    }

    try {
        const [results] = await db.query(query, params);
        res.json(results);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).send(err);
    }
});

// CREATE USER
app.post("/createUser", async (req, res) => {
    const { name, email, password, user_type } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [result] = await db.query('SELECT * FROM user_table WHERE email = ?', [email]);
        
        if (result.length !== 0) {
            return res.status(409).send("User already exists");
        }

        await db.query('INSERT INTO user_table (user_name, email, password_hash, user_type) VALUES (?, ?, ?, ?)', 
            [name, email, hashedPassword, user_type]);
        
        res.status(201).send("User created successfully");
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Login Route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [result] = await db.query('SELECT * FROM user_table WHERE email = ?', [email]);

        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const hashedPassword = result[0].password_hash;
        const passwordMatch = await bcrypt.compare(password, hashedPassword);

        if (passwordMatch) {
            const token = generateAccessToken({
                user_id: result[0].user_id,
                user_email: result[0].email,
                user_type: result[0].user_type,
            });

            return res.status(200).json({
                message: `${email} is logged in!`,
                accessToken: token,
                user_id: result[0].user_id,
                user_email: result[0].email,
                user_type: result[0].user_type,
            });
        } else {
            return res.status(401).json({ message: "Password incorrect!" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
