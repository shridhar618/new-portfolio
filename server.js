const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to SQLite3
const db = new sqlite3.Database('./portfolio.db', (err) => {
    if (err) return console.error('SQLite connection error:', err);
    console.log('Connected to SQLite database.');
});

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    company TEXT,
    project TEXT,
    budget TEXT,
    message TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Ensure 'pdfs' directory existscurl -X POST http://localhost:3000/submit -d "name=Test&email=test@example.com&company=TestCo&project=Web&budget=1000&message=Hello"
// if (!fs.existsSync('./pdfs')) {
//     fs.mkdirSync('./pdfs');
// }

// Middleware
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Form submission
app.post('/submit', (req, res) => {
    // Log the received data for debugging
    console.log('Received form data:', req.body);

    // Use empty string if any field is missing
    const name = req.body.name || '';
    const email = req.body.email || '';
    const company = req.body.company || '';
    const project = req.body.project || '';
    const budget = req.body.budget || '';
    const message = req.body.message || '';

    db.run(
        `INSERT INTO customers (name, email, company, project, budget, message) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, company, project, budget, message],
        function (err) {
            if (err) {
                console.error('DB Insert Error:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true });
        }
    );
});

// --- Add this middleware before your /admin route ---
const ADMIN_USER = 'admin'; // change as needed
const ADMIN_PASS = 'shri123'; // change as needed

function basicAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) {
        res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Authentication required.');
    }
    // Decode base64
    const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication failed.');
}

// --- Protect the /admin route ---
app.get('/admin', basicAuth, (req, res) => {
    db.all('SELECT * FROM customers ORDER BY date DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).send("DB error");
        }
        res.render('admin', { customers: rows });
    });
});

// PDF download
app.get('/download/:id', (req, res) => {
    const customerId = req.params.id;
    db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, customer) => {
        if (err || !customer) return res.status(404).send("Customer not found");

        const filePath = path.join(__dirname, 'pdfs', `customer_${customerId}.pdf`);
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(filePath));

        doc.fontSize(18).text(`Customer Details`, { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Name: ${customer.name}`);
        doc.text(`Email: ${customer.email}`);
        doc.text(`Company: ${customer.company}`);
        doc.text(`Project Type: ${customer.project}`);
        doc.text(`Budget: ${customer.budget}`);
        doc.text(`Message: ${customer.message}`);
        doc.end();

        doc.on('finish', () => {
            res.download(filePath);
        });
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
