const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require("bcrypt");

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

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'sealSPACE96', // Replace with your MySQL password
    database: 'event_reservation',
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

// API route to get events
app.get('/events', (req, res) => {
    const category = req.query.category; // Capture the category from the query parameter

    let query = 'SELECT * FROM events';
    const params = [];

    if (category) {
        query += ' WHERE category = ?';
        params.push(category);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching events:', err);
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
