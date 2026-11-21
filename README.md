# Portfolio with Client Enquiry System

A portfolio website with a client enquiry form. Submissions are stored in SQLite, and a password-protected admin panel lets you review each enquiry and download it as a PDF.

## Features

- Project enquiry form (name, email, company, project, budget, message)
- Submissions saved to SQLite, with a thank-you page
- Admin panel behind HTTP Basic Auth (`/admin`), rendered with EJS
- Download any enquiry as a PDF (`/download/:id`, generated with PDFKit)

## Tech stack

Node.js · Express · SQLite · EJS · PDFKit · Nodemailer

## Getting started

```bash
npm install express body-parser sqlite3 ejs pdfkit nodemailer
node server.js
```

Then open http://localhost:3000.

## Project structure

```
server.js            Express server, database setup and routes
public/              index.html and thank-you.html
views/admin.ejs      Admin dashboard
```
