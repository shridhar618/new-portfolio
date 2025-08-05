const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// SQLite setup
const db = new sqlite3.Database('./database.db');
db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    company TEXT,
    project TEXT,
    budget TEXT,
    message TEXT
)`);

// Routes
app.post('/submit', (req, res) => {
    const { name, email, company, project, budget, message } = req.body;

    db.run(
        `INSERT INTO customers (name, email, company, project, budget, message) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, company, project, budget, message],
        function (err) {
            if (err) return res.status(500).send("Error saving data.");
            res.redirect('/thank-you.html');
        }
    );
});

app.get('/admin', (req, res) => {
    db.all('SELECT * FROM customers', (err, rows) => {
        if (err) return res.status(500).send("DB error");
        res.render('admin', { customers: rows });
    });
});

app.get('/download/:id', (req, res) => {
    const customerId = req.params.id;

    db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, row) => {
        if (err || !row) return res.status(404).send("Customer not found");

        const doc = new PDFDocument();
        const filePath = path.join(__dirname, 'pdfs', `customer_${customerId}.pdf`);
        doc.pipe(fs.createWriteStream(filePath));

        doc.fontSize(18).text(`Customer Details`, { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Name: ${row.name}`);
        doc.text(`Email: ${row.email}`);
        doc.text(`Company: ${row.company}`);
        doc.text(`Project Type: ${row.project}`);
        doc.text(`Budget: ${row.budget}`);
        doc.text(`Message: ${row.message}`);

        doc.end();

        doc.on('finish', () => {
            res.download(filePath);
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
