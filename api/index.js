// const express = require('express');
// const multer = require('multer');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');

// const app = express();
// const db = new Database('maintenance.db');

// // Ensure upload directories exist
// fs.mkdirSync('./uploads/issues', { recursive: true });
// fs.mkdirSync('./uploads/fixes', { recursive: true });

// // Initialize SQLite Database Table
// db.exec(`
//   CREATE TABLE IF NOT EXISTS complaints (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     student_name TEXT NOT NULL,
//     room_number TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT NOT NULL,
//     issue_photo TEXT NOT NULL,
//     status TEXT DEFAULT 'Pending',
//     fix_photo TEXT DEFAULT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//   )
// `);

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // Configure Multer Storage for Photos
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'issue_photo') {
//       cb(null, 'uploads/issues/');
//     } else if (file.fieldname === 'fix_photo') {
//       cb(null, 'uploads/fixes/');
//     }
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // --- API ENDPOINTS ---

// // 1. Get all complaints
// app.get('/api/complaints', (req, res) => {
//   const stmt = db.prepare('SELECT * FROM complaints ORDER BY created_at DESC');
//   const complaints = stmt.all();
//   res.json(complaints);
// });

// // 2. Submit a new complaint (Student)
// app.post('/api/complaints', upload.single('issue_photo'), (req, res) => {
//   const { student_name, room_number, category, description } = req.body;
//   if (!req.file) {
//     return res.status(400).json({ error: 'Issue photo is required' });
//   }

//   const stmt = db.prepare(`
//     INSERT INTO complaints (student_name, room_number, category, description, issue_photo)
//     VALUES (?, ?, ?, ?, ?)
//   `);
//   stmt.run(student_name, room_number, category, description, req.file.filename);
//   res.redirect('/#caretaker'); // Redirect back to UI
// });

// // 3. Resolve a complaint (Caretaker)
// app.post('/api/complaints/resolve/:id', upload.single('fix_photo'), (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body; // 'Repaired' or 'Replaced'

//   if (!req.file) {
//     return res.status(400).json({ error: 'Fix photo proof is required' });
//   }

//   const stmt = db.prepare(`
//     UPDATE complaints 
//     SET status = ?, fix_photo = ? 
//     WHERE id = ?
//   `);
//   stmt.run(status, req.file.filename, id);
//   res.json({ success: true });
// });

// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });


// const express = require('express');
// const multer = require('multer');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');

// const app = express();
// const db = new Database('maintenance.db');

// // Ensure upload directories exist
// fs.mkdirSync('./uploads/issues', { recursive: true });
// fs.mkdirSync('./uploads/fixes', { recursive: true });

// // Initialize SQLite Table
// db.exec(`
//   CREATE TABLE IF NOT EXISTS complaints (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     student_name TEXT NOT NULL,
//     room_number TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT NOT NULL,
//     issue_photo TEXT NOT NULL,
//     status TEXT DEFAULT 'Pending',
//     fix_photo TEXT DEFAULT NULL,
//     upvotes INTEGER DEFAULT 0,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     resolved_at DATETIME DEFAULT NULL
//   )
// `);

// // Auto-verify after 24 hours
// function autoVerifyComplaints() {
//   try {
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = 'Resolved (Auto)' 
//       WHERE status LIKE 'Awaiting%' 
//         AND datetime(resolved_at, '+24 hours') <= datetime('now')
//     `);
//     stmt.run();
//   } catch (err) {
//     console.error('Auto-verify error:', err.message);
//   }
// }

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // File Upload Config
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'issue_photo') cb(null, 'uploads/issues/');
//     else if (file.fieldname === 'fix_photo') cb(null, 'uploads/fixes/');
//     else cb(new Error('Invalid field name'), null);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // --- ENDPOINTS ---

// // 1. Fetch complaints
// app.get('/api/complaints', (req, res) => {
//   autoVerifyComplaints();
//   try {
//     const stmt = db.prepare(`
//       SELECT *, 
//         CAST((julianday('now') - julianday(resolved_at)) * 24 AS REAL) as hours_since_fix
//       FROM complaints 
//       ORDER BY 
//         CASE 
//           WHEN status = 'Pending' THEN 0 
//           WHEN status LIKE 'Awaiting%' THEN 1 
//           ELSE 2 
//         END,
//         upvotes DESC, 
//         created_at DESC
//     `);
//     res.json(stmt.all());
//   } catch (err) {
//     console.error('Fetch error:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. Upvote an issue
// app.post('/api/complaints/upvote/:id', (req, res) => {
//   try {
//     const stmt = db.prepare('UPDATE complaints SET upvotes = upvotes + 1 WHERE id = ?');
//     stmt.run(req.params.id);
//     res.json({ success: true });
//   } catch (err) {
//     console.error('Upvote error:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // 3. New Complaint (Student)
// app.post('/api/complaints', upload.single('issue_photo'), (req, res) => {
//   try {
//     const { student_name, room_number, category, description } = req.body;
//     if (!req.file) return res.status(400).send('Issue photo required');

//     const stmt = db.prepare(`
//       INSERT INTO complaints (student_name, room_number, category, description, issue_photo)
//       VALUES (?, ?, ?, ?, ?)
//     `);
//     stmt.run(student_name, room_number, category, description, req.file.filename);
//     res.redirect('/');
//   } catch (err) {
//     console.error('Insert error:', err.message);
//     res.status(500).send('Database error: ' + err.message);
//   }
// });

// // 4. Submit Caretaker Fix
// app.post('/api/complaints/resolve/:id', upload.single('fix_photo'), (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action_type } = req.body;

//     if (!req.file) return res.status(400).json({ error: 'Proof photo required' });

//     const statusStr = `Awaiting Verification (${action_type || 'Repaired'})`;
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = ?, fix_photo = ?, resolved_at = CURRENT_TIMESTAMP 
//       WHERE id = ?
//     `);
//     stmt.run(statusStr, req.file.filename, id);
//     res.json({ success: true });
//   } catch (err) {
//     console.error('Resolve error:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. Student Verification Outcome
// app.post('/api/complaints/verify/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const { approved } = req.body;

//     if (approved) {
//       const stmt = db.prepare("UPDATE complaints SET status = 'Resolved (Verified)' WHERE id = ?");
//       stmt.run(id);
//     } else {
//       const stmt = db.prepare("UPDATE complaints SET status = 'Pending', fix_photo = NULL, resolved_at = NULL WHERE id = ?");
//       stmt.run(id);
//     }
//     res.json({ success: true });
//   } catch (err) {
//     console.error('Verify error:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));



// const express = require('express');
// const multer = require('multer');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');

// const app = express();
// const db = new Database('maintenance.db');

// // Ensure upload directories exist
// fs.mkdirSync('./uploads/issues', { recursive: true });
// fs.mkdirSync('./uploads/fixes', { recursive: true });

// // Initialize SQLite Database Table with hostel_name
// db.exec(`
//   CREATE TABLE IF NOT EXISTS complaints (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     hostel_name TEXT NOT NULL,
//     student_name TEXT NOT NULL,
//     room_number TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT NOT NULL,
//     issue_photo TEXT NOT NULL,
//     status TEXT DEFAULT 'Pending',
//     fix_photo TEXT DEFAULT NULL,
//     upvotes INTEGER DEFAULT 0,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     resolved_at DATETIME DEFAULT NULL
//   )
// `);

// function autoVerifyComplaints() {
//   try {
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = 'Resolved (Auto)' 
//       WHERE status LIKE 'Awaiting%' 
//         AND datetime(resolved_at, '+24 hours') <= datetime('now')
//     `);
//     stmt.run();
//   } catch (err) {
//     console.error('Auto-verify error:', err.message);
//   }
// }

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // Configure Multer Storage for local files
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'issue_photo') cb(null, 'uploads/issues/');
//     else if (file.fieldname === 'fix_photo') cb(null, 'uploads/fixes/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // --- API ENDPOINTS ---

// app.get('/api/complaints', (req, res) => {
//   autoVerifyComplaints();
//   const { hostel } = req.query;

//   try {
//     let query = `
//       SELECT *, 
//         CAST((julianday('now') - julianday(resolved_at)) * 24 AS REAL) as hours_since_fix
//       FROM complaints 
//     `;
//     let params = [];

//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = ? `;
//       params.push(hostel);
//     }

//     query += `
//       ORDER BY 
//         CASE 
//           WHEN status = 'Pending' THEN 0 
//           WHEN status LIKE 'Awaiting%' THEN 1 
//           ELSE 2 
//         END,
//         upvotes DESC, 
//         created_at DESC
//     `;

//     const stmt = db.prepare(query);
//     res.json(stmt.all(...params));
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post('/api/complaints/upvote/:id', (req, res) => {
//   try {
//     const stmt = db.prepare('UPDATE complaints SET upvotes = upvotes + 1 WHERE id = ?');
//     stmt.run(req.params.id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post('/api/complaints', upload.single('issue_photo'), (req, res) => {
//   try {
//     const { hostel_name, student_name, room_number, category, description } = req.body;
//     if (!req.file) return res.status(400).send('Issue photo required');

//     const stmt = db.prepare(`
//       INSERT INTO complaints (hostel_name, student_name, room_number, category, description, issue_photo)
//       VALUES (?, ?, ?, ?, ?, ?)
//     `);
//     stmt.run(hostel_name, student_name, room_number, category, description, req.file.filename);
//     res.redirect('/');
//   } catch (err) {
//     res.status(500).send('Database error: ' + err.message);
//   }
// });

// app.post('/api/complaints/resolve/:id', upload.single('fix_photo'), (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action_type } = req.body;

//     if (!req.file) return res.status(400).json({ error: 'Proof photo required' });

//     const statusStr = `Awaiting Verification (${action_type || 'Repaired'})`;
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = ?, fix_photo = ?, resolved_at = CURRENT_TIMESTAMP 
//       WHERE id = ?
//     `);
//     stmt.run(statusStr, req.file.filename, id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post('/api/complaints/verify/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const { approved } = req.body;

//     if (approved) {
//       const stmt = db.prepare("UPDATE complaints SET status = 'Resolved (Verified)' WHERE id = ?");
//       stmt.run(id);
//     } else {
//       const stmt = db.prepare("UPDATE complaints SET status = 'Pending', fix_photo = NULL, resolved_at = NULL WHERE id = ?");
//       stmt.run(id);
//     }
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));



// const express = require('express');
// const multer = require('multer');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');

// const app = express();
// const db = new Database('maintenance.db');

// // Ensure upload directories exist
// fs.mkdirSync('./uploads/issues', { recursive: true });
// fs.mkdirSync('./uploads/fixes', { recursive: true });

// // Initialize Database with OTP support and zero-default upvotes
// db.exec(`
//   CREATE TABLE IF NOT EXISTS complaints (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     hostel_name TEXT NOT NULL,
//     student_name TEXT NOT NULL,
//     room_number TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT NOT NULL,
//     issue_photo TEXT NOT NULL,
//     status TEXT DEFAULT 'Pending',
//     fix_photo TEXT DEFAULT NULL,
//     upvotes INTEGER DEFAULT 0,
//     otp_code TEXT DEFAULT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     resolved_at DATETIME DEFAULT NULL
//   )
// `);

// // Helper function to auto-verify complaints after 24 hours
// function autoVerifyComplaints() {
//   try {
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = 'Resolved (Auto)' 
//       WHERE status LIKE 'Awaiting%' 
//         AND datetime(resolved_at, '+24 hours') <= datetime('now')
//     `);
//     stmt.run();
//   } catch (err) {
//     console.error('Auto-verify error:', err.message);
//   }
// }

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // Configure Multer Storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'issue_photo') cb(null, 'uploads/issues/');
//     else if (file.fieldname === 'fix_photo') cb(null, 'uploads/fixes/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // --- API ENDPOINTS ---

// // 1. Fetch complaints
// app.get('/api/complaints', (req, res) => {
//   autoVerifyComplaints();
//   const { hostel } = req.query;

//   try {
//     let query = `
//       SELECT id, hostel_name, student_name, room_number, category, description, 
//              issue_photo, status, fix_photo, COALESCE(upvotes, 0) as upvotes, created_at,
//              CAST((julianday('now') - julianday(resolved_at)) * 24 AS REAL) as hours_since_fix
//       FROM complaints 
//     `;
//     let params = [];

//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = ? `;
//       params.push(hostel);
//     }

//     query += `
//       ORDER BY 
//         CASE 
//           WHEN status = 'Pending' THEN 0 
//           WHEN status LIKE 'Awaiting%' THEN 1 
//           ELSE 2 
//         END,
//         COALESCE(upvotes, 0) DESC, 
//         created_at DESC
//     `;

//     const stmt = db.prepare(query);
//     res.json(stmt.all(...params));
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. Fixed Upvote Endpoint
// app.post('/api/complaints/upvote/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const stmt = db.prepare('UPDATE complaints SET upvotes = COALESCE(upvotes, 0) + 1 WHERE id = ?');
//     stmt.run(id);
    
//     // Return the fresh upvote count
//     const updated = db.prepare('SELECT COALESCE(upvotes, 0) as upvotes FROM complaints WHERE id = ?').get(id);
//     res.json({ success: true, upvotes: updated.upvotes });
//   } catch (err) {
//     console.error("Upvote backend error:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // 3. New Complaint (Student)
// app.post('/api/complaints', upload.single('issue_photo'), (req, res) => {
//   try {
//     const { hostel_name, student_name, room_number, category, description } = req.body;
//     if (!req.file) return res.status(400).send('Issue photo required');

//     const stmt = db.prepare(`
//       INSERT INTO complaints (hostel_name, student_name, room_number, category, description, issue_photo, upvotes)
//       VALUES (?, ?, ?, ?, ?, ?, 0)
//     `);
//     stmt.run(hostel_name, student_name, room_number, category, description, req.file.filename);
//     res.redirect('/');
//   } catch (err) {
//     res.status(500).send('Database error: ' + err.message);
//   }
// });

// // 4. Caretaker Submits Fix
// app.post('/api/complaints/resolve/:id', upload.single('fix_photo'), (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action_type } = req.body;

//     if (!req.file) return res.status(400).json({ error: 'Proof photo required' });

//     const statusStr = `Awaiting Verification (${action_type || 'Repaired'})`;
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = ?, fix_photo = ?, resolved_at = CURRENT_TIMESTAMP 
//       WHERE id = ?
//     `);
//     stmt.run(statusStr, req.file.filename, id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. Generate and Send OTP to Student
// app.post('/api/complaints/send-otp/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     // Generate 6-digit OTP
//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

//     const stmt = db.prepare('UPDATE complaints SET otp_code = ? WHERE id = ?');
//     stmt.run(generatedOtp, id);

//     // In a production setup, you would integrate an SMS/Email API here (e.g. Twilio or Nodemailer).
//     // For local testing, we return the generated OTP in the response.
//     res.json({ success: true, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 6. Verify OTP and Confirm Resolution
// app.post('/api/complaints/verify-otp/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp, approved } = req.body;

//     if (!approved) {
//       // Reopen issue directly if rejected
//       const stmt = db.prepare("UPDATE complaints SET status = 'Pending', fix_photo = NULL, resolved_at = NULL, otp_code = NULL WHERE id = ?");
//       stmt.run(id);
//       return res.json({ success: true, status: 'Reopened' });
//     }

//     const complaint = db.prepare('SELECT otp_code FROM complaints WHERE id = ?').get(id);

//     if (!complaint || complaint.otp_code !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid OTP entered. Please try again.' });
//     }

//     // OTP matched: Confirm resolution
//     const stmt = db.prepare("UPDATE complaints SET status = 'Resolved (Verified)', otp_code = NULL WHERE id = ?");
//     stmt.run(id);

//     res.json({ success: true, status: 'Resolved' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));



// const express = require('express');
// const multer = require('multer');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');
// const nodemailer = require('nodemailer');

// const app = express();
// const db = new Database('maintenance.db');

// // Ensure upload directories exist
// fs.mkdirSync('./uploads/issues', { recursive: true });
// fs.mkdirSync('./uploads/fixes', { recursive: true });

// // Configure Email Transporter
// // NOTE: For production/Gmail, use an App Password or SMTP server details
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER || 'your-email@gmail.com',
//     pass: process.env.EMAIL_PASS || 'your-app-password'
//   }
// });

// // Initialize Database (Schema updated: kerberos_id added, student_name & room_number removed)
// db.exec(`
//   CREATE TABLE IF NOT EXISTS complaints (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     hostel_name TEXT NOT NULL,
//     kerberos_id TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT NOT NULL,
//     issue_photo TEXT NOT NULL,
//     status TEXT DEFAULT 'Pending',
//     fix_photo TEXT DEFAULT NULL,
//     upvotes INTEGER DEFAULT 0,
//     otp_code TEXT DEFAULT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     resolved_at DATETIME DEFAULT NULL
//   )
// `);

// function autoVerifyComplaints() {
//   try {
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = 'Resolved (Auto)' 
//       WHERE status LIKE 'Awaiting%' 
//         AND datetime(resolved_at, '+24 hours') <= datetime('now')
//     `);
//     stmt.run();
//   } catch (err) {
//     console.error('Auto-verify error:', err.message);
//   }
// }

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // Configure Multer Storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'issue_photo') cb(null, 'uploads/issues/');
//     else if (file.fieldname === 'fix_photo') cb(null, 'uploads/fixes/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // --- API ENDPOINTS ---

// // 1. Fetch complaints
// app.get('/api/complaints', (req, res) => {
//   autoVerifyComplaints();
//   const { hostel } = req.query;

//   try {
//     let query = `
//       SELECT id, hostel_name, kerberos_id, category, description, 
//              issue_photo, status, fix_photo, COALESCE(upvotes, 0) as upvotes, created_at,
//              CAST((julianday('now') - julianday(resolved_at)) * 24 AS REAL) as hours_since_fix
//       FROM complaints 
//     `;
//     let params = [];

//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = ? `;
//       params.push(hostel);
//     }

//     query += `
//       ORDER BY 
//         CASE 
//           WHEN status = 'Pending' THEN 0 
//           WHEN status LIKE 'Awaiting%' THEN 1 
//           ELSE 2 
//         END,
//         COALESCE(upvotes, 0) DESC, 
//         created_at DESC
//     `;

//     const stmt = db.prepare(query);
//     res.json(stmt.all(...params));
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. Upvote Endpoint
// app.post('/api/complaints/upvote/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const stmt = db.prepare('UPDATE complaints SET upvotes = COALESCE(upvotes, 0) + 1 WHERE id = ?');
//     stmt.run(id);
    
//     const updated = db.prepare('SELECT COALESCE(upvotes, 0) as upvotes FROM complaints WHERE id = ?').get(id);
//     res.json({ success: true, upvotes: updated.upvotes });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 3. New Complaint (Student)
// app.post('/api/complaints', upload.single('issue_photo'), (req, res) => {
//   try {
//     const { hostel_name, kerberos_id, category, description } = req.body;
//     if (!req.file) return res.status(400).send('Issue photo required');

//     // Clean Kerberos ID (strip @iitd.ac.in if typed by mistake)
//     const cleanKerberos = kerberos_id.trim().toLowerCase().replace('@iitd.ac.in', '');

//     const stmt = db.prepare(`
//       INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo, upvotes)
//       VALUES (?, ?, ?, ?, ?, 0)
//     `);
//     stmt.run(hostel_name, cleanKerberos, category, description, req.file.filename);
//     res.redirect('/');
//   } catch (err) {
//     res.status(500).send('Database error: ' + err.message);
//   }
// });

// // 4. Caretaker Submits Fix
// app.post('/api/complaints/resolve/:id', upload.single('fix_photo'), (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action_type } = req.body;

//     if (!req.file) return res.status(400).json({ error: 'Proof photo required' });

//     const statusStr = `Awaiting Verification (${action_type || 'Repaired'})`;
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = ?, fix_photo = ?, resolved_at = CURRENT_TIMESTAMP 
//       WHERE id = ?
//     `);
//     stmt.run(statusStr, req.file.filename, id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. Send OTP to Student's Kerberos Email
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const complaint = db.prepare('SELECT kerberos_id, category, hostel_name FROM complaints WHERE id = ?').get(id);

//     if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;

//     // Save OTP to database
//     db.prepare('UPDATE complaints SET otp_code = ? WHERE id = ?').run(generatedOtp, id);

//     // Email Options
//     const mailOptions = {
//       from: '"Hostel Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `Verification OTP for ${complaint.category} Issue - ${complaint.hostel_name}`,
//       html: `
//         <h3>Hostel Maintenance Fix Verification</h3>
//         <p>The caretaker has marked your <b>${complaint.category}</b> issue as fixed.</p>
//         <p>Your 6-digit OTP to confirm and resolve this ticket is:</p>
//         <h2 style="color: #27ae60; letter-spacing: 2px;">${generatedOtp}</h2>
//         <p>If the work is incomplete, you can reject the fix directly on the portal.</p>
//       `
//     };

//     // Send Mail (or log to console if SMTP credentials aren't set)
//     try {
//       await transporter.sendMail(mailOptions);
//       console.log(`OTP email sent to ${studentEmail}`);
//     } catch (mailErr) {
//       console.log(`[SMTP Offline Fallback] OTP for ${studentEmail}: ${generatedOtp}`);
//     }

//     res.json({ success: true, emailSentTo: studentEmail, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 6. Verify OTP and Resolve
// app.post('/api/complaints/verify-otp/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp, approved } = req.body;

//     if (!approved) {
//       const stmt = db.prepare("UPDATE complaints SET status = 'Pending', fix_photo = NULL, resolved_at = NULL, otp_code = NULL WHERE id = ?");
//       stmt.run(id);
//       return res.json({ success: true, status: 'Reopened' });
//     }

//     const complaint = db.prepare('SELECT otp_code FROM complaints WHERE id = ?').get(id);

//     if (!complaint || complaint.otp_code !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid OTP entered. Please try again.' });
//     }

//     const stmt = db.prepare("UPDATE complaints SET status = 'Resolved (Verified)', otp_code = NULL WHERE id = ?");
//     stmt.run(id);

//     res.json({ success: true, status: 'Resolved' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));



// const express = require('express');
// const multer = require('multer');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');
// const nodemailer = require('nodemailer');

// const app = express();
// const db = new Database('maintenance.db');

// // Ensure upload directories exist
// fs.mkdirSync('./uploads/issues', { recursive: true });
// fs.mkdirSync('./uploads/fixes', { recursive: true });

// // Configure Email Transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER || 'your-email@gmail.com',
//     pass: process.env.EMAIL_PASS || 'your-app-password'
//   }
// });

// // Initialize Database Table
// db.exec(`
//   CREATE TABLE IF NOT EXISTS complaints (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     hostel_name TEXT NOT NULL,
//     kerberos_id TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT NOT NULL,
//     issue_photo TEXT NOT NULL,
//     status TEXT DEFAULT 'Pending',
//     fix_photo TEXT DEFAULT NULL,
//     upvotes INTEGER DEFAULT 0,
//     otp_code TEXT DEFAULT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     resolved_at DATETIME DEFAULT NULL
//   )
// `);

// function autoVerifyComplaints() {
//   try {
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = 'Resolved (Auto)' 
//       WHERE status LIKE 'Awaiting%' 
//         AND datetime(resolved_at, '+24 hours') <= datetime('now')
//     `);
//     stmt.run();
//   } catch (err) {
//     console.error('Auto-verify error:', err.message);
//   }
// }

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // Configure Multer Storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'issue_photo') cb(null, 'uploads/issues/');
//     else if (file.fieldname === 'fix_photo') cb(null, 'uploads/fixes/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // --- API ENDPOINTS ---

// // 1. Fetch complaints
// app.get('/api/complaints', (req, res) => {
//   autoVerifyComplaints();
//   const { hostel } = req.query;

//   try {
//     let query = `
//       SELECT id, hostel_name, kerberos_id, category, description, 
//              issue_photo, status, fix_photo, COALESCE(upvotes, 0) as upvotes, created_at,
//              CAST((julianday('now') - julianday(resolved_at)) * 24 AS REAL) as hours_since_fix
//       FROM complaints 
//     `;
//     let params = [];

//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = ? `;
//       params.push(hostel);
//     }

//     query += `
//       ORDER BY 
//         CASE 
//           WHEN status = 'Pending' THEN 0 
//           WHEN status LIKE 'Awaiting%' THEN 1 
//           ELSE 2 
//         END,
//         COALESCE(upvotes, 0) DESC, 
//         created_at DESC
//     `;

//     const stmt = db.prepare(query);
//     res.json(stmt.all(...params));
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. Upvote Endpoint (Fixed)
// app.post('/api/complaints/upvote/:id', (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Increment upvote count
//     const updateStmt = db.prepare('UPDATE complaints SET upvotes = COALESCE(upvotes, 0) + 1 WHERE id = ?');
//     updateStmt.run(id);
    
//     // Get fresh count
//     const row = db.prepare('SELECT COALESCE(upvotes, 0) as upvotes FROM complaints WHERE id = ?').get(id);
    
//     res.json({ success: true, upvotes: row ? row.upvotes : 0 });
//   } catch (err) {
//     console.error("Upvote backend error:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // 3. New Complaint
// app.post('/api/complaints', upload.single('issue_photo'), (req, res) => {
//   try {
//     const { hostel_name, kerberos_id, category, description } = req.body;
//     if (!req.file) return res.status(400).send('Issue photo required');

//     const cleanKerberos = kerberos_id.trim().toLowerCase().replace('@iitd.ac.in', '');

//     const stmt = db.prepare(`
//       INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo, upvotes)
//       VALUES (?, ?, ?, ?, ?, 0)
//     `);
//     stmt.run(hostel_name, cleanKerberos, category, description, req.file.filename);
//     res.redirect('/');
//   } catch (err) {
//     res.status(500).send('Database error: ' + err.message);
//   }
// });

// // 4. Caretaker Submits Fix
// app.post('/api/complaints/resolve/:id', upload.single('fix_photo'), (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action_type } = req.body;

//     if (!req.file) return res.status(400).json({ error: 'Proof photo required' });

//     const statusStr = `Awaiting Verification (${action_type || 'Repaired'})`;
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = ?, fix_photo = ?, resolved_at = CURRENT_TIMESTAMP 
//       WHERE id = ?
//     `);
//     stmt.run(statusStr, req.file.filename, id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. Send OTP
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const complaint = db.prepare('SELECT kerberos_id, category, hostel_name FROM complaints WHERE id = ?').get(id);

//     if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;

//     db.prepare('UPDATE complaints SET otp_code = ? WHERE id = ?').run(generatedOtp, id);

//     const mailOptions = {
//       from: '"Hostel Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `Verification OTP for ${complaint.category} Issue - ${complaint.hostel_name}`,
//       html: `
//         <h3>Hostel Maintenance Fix Verification</h3>
//         <p>The caretaker has marked your <b>${complaint.category}</b> issue as fixed.</p>
//         <p>Your 6-digit OTP to confirm and resolve this ticket is:</p>
//         <h2 style="color: #27ae60; letter-spacing: 2px;">${generatedOtp}</h2>
//         <p>If the work is incomplete, you can reject the fix directly on the portal.</p>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Offline Fallback] OTP for ${studentEmail}: ${generatedOtp}`);
//     }

//     res.json({ success: true, emailSentTo: studentEmail, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 6. Verify OTP
// app.post('/api/complaints/verify-otp/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp, approved } = req.body;

//     if (!approved) {
//       const stmt = db.prepare("UPDATE complaints SET status = 'Pending', fix_photo = NULL, resolved_at = NULL, otp_code = NULL WHERE id = ?");
//       stmt.run(id);
//       return res.json({ success: true, status: 'Reopened' });
//     }

//     const complaint = db.prepare('SELECT otp_code FROM complaints WHERE id = ?').get(id);

//     if (!complaint || complaint.otp_code !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid OTP entered. Please try again.' });
//     }

//     const stmt = db.prepare("UPDATE complaints SET status = 'Resolved (Verified)', otp_code = NULL WHERE id = ?");
//     stmt.run(id);

//     res.json({ success: true, status: 'Resolved' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));



// const express = require('express');
// const multer = require('multer');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');
// const nodemailer = require('nodemailer');

// const app = express();
// const db = new Database('maintenance.db');

// // Ensure upload directories exist
// fs.mkdirSync('./uploads/issues', { recursive: true });
// fs.mkdirSync('./uploads/fixes', { recursive: true });

// // Configure Email Transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER || 'your-email@gmail.com',
//     pass: process.env.EMAIL_PASS || 'your-app-password'
//   }
// });

// // Initialize Database Table
// db.exec(`
//   CREATE TABLE IF NOT EXISTS complaints (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     hostel_name TEXT NOT NULL,
//     kerberos_id TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT NOT NULL,
//     issue_photo TEXT NOT NULL,
//     status TEXT DEFAULT 'Pending',
//     fix_photo TEXT DEFAULT NULL,
//     otp_code TEXT DEFAULT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     resolved_at DATETIME DEFAULT NULL
//   )
// `);

// function autoVerifyComplaints() {
//   try {
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = 'Resolved (Auto)' 
//       WHERE status LIKE 'Awaiting%' 
//         AND datetime(resolved_at, '+24 hours') <= datetime('now')
//     `);
//     stmt.run();
//   } catch (err) {
//     console.error('Auto-verify error:', err.message);
//   }
// }

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // Configure Multer Storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'issue_photo') cb(null, 'uploads/issues/');
//     else if (file.fieldname === 'fix_photo') cb(null, 'uploads/fixes/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // --- API ENDPOINTS ---

// // 1. Fetch complaints (Pending first, then chronologically)
// app.get('/api/complaints', (req, res) => {
//   autoVerifyComplaints();
//   const { hostel } = req.query;

//   try {
//     let query = `
//       SELECT id, hostel_name, kerberos_id, category, description, 
//              issue_photo, status, fix_photo, created_at,
//              CAST((julianday('now') - julianday(resolved_at)) * 24 AS REAL) as hours_since_fix
//       FROM complaints 
//     `;
//     let params = [];

//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = ? `;
//       params.push(hostel);
//     }

//     query += `
//       ORDER BY 
//         CASE 
//           WHEN status = 'Pending' THEN 0 
//           WHEN status LIKE 'Awaiting%' THEN 1 
//           ELSE 2 
//         END,
//         created_at DESC
//     `;

//     const stmt = db.prepare(query);
//     res.json(stmt.all(...params));
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. New Complaint (Student)
// app.post('/api/complaints', upload.single('issue_photo'), (req, res) => {
//   try {
//     const { hostel_name, kerberos_id, category, description } = req.body;
//     if (!req.file) return res.status(400).send('Issue photo required');

//     const cleanKerberos = kerberos_id.trim().toLowerCase().replace('@iitd.ac.in', '');

//     const stmt = db.prepare(`
//       INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo)
//       VALUES (?, ?, ?, ?, ?)
//     `);
//     stmt.run(hostel_name, cleanKerberos, category, description, req.file.filename);
//     res.redirect('/');
//   } catch (err) {
//     res.status(500).send('Database error: ' + err.message);
//   }
// });

// // 3. Caretaker Submits Fix
// app.post('/api/complaints/resolve/:id', upload.single('fix_photo'), (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action_type } = req.body;

//     if (!req.file) return res.status(400).json({ error: 'Proof photo required' });

//     const statusStr = `Awaiting Verification (${action_type || 'Repaired'})`;
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = ?, fix_photo = ?, resolved_at = CURRENT_TIMESTAMP 
//       WHERE id = ?
//     `);
//     stmt.run(statusStr, req.file.filename, id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 4. Send OTP to Student's Email
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const complaint = db.prepare('SELECT kerberos_id, category, hostel_name FROM complaints WHERE id = ?').get(id);

//     if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;

//     db.prepare('UPDATE complaints SET otp_code = ? WHERE id = ?').run(generatedOtp, id);

//     const mailOptions = {
//       from: '"Hostel Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `Verification OTP for ${complaint.category} Issue - ${complaint.hostel_name}`,
//       html: `
//         <h3>Hostel Maintenance Fix Verification</h3>
//         <p>The caretaker has marked your <b>${complaint.category}</b> issue as fixed.</p>
//         <p>Your 6-digit OTP to confirm and resolve this ticket is:</p>
//         <h2 style="color: #27ae60; letter-spacing: 2px;">${generatedOtp}</h2>
//         <p>If the work is incomplete, you can reject the fix directly on the portal.</p>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Offline Fallback] OTP for ${studentEmail}: ${generatedOtp}`);
//     }

//     res.json({ success: true, emailSentTo: studentEmail, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. Verify OTP and Resolve
// app.post('/api/complaints/verify-otp/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp, approved } = req.body;

//     if (!approved) {
//       const stmt = db.prepare("UPDATE complaints SET status = 'Pending', fix_photo = NULL, resolved_at = NULL, otp_code = NULL WHERE id = ?");
//       stmt.run(id);
//       return res.json({ success: true, status: 'Reopened' });
//     }

//     const complaint = db.prepare('SELECT otp_code FROM complaints WHERE id = ?').get(id);

//     if (!complaint || complaint.otp_code !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid OTP entered. Please try again.' });
//     }

//     const stmt = db.prepare("UPDATE complaints SET status = 'Resolved (Verified)', otp_code = NULL WHERE id = ?");
//     stmt.run(id);

//     res.json({ success: true, status: 'Resolved' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));


// require('dotenv').config();
// const express = require('express');
// const multer = require('multer');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');
// const nodemailer = require('nodemailer');

// const app = express();
// const db = new Database('maintenance.db');

// // Ensure upload directories exist
// fs.mkdirSync('./uploads/issues', { recursive: true });
// fs.mkdirSync('./uploads/fixes', { recursive: true });

// // Configure Email Transporter
// // const transporter = nodemailer.createTransport({
// //   service: 'gmail',
// //   auth: {
// //     user: process.env.EMAIL_USER || 'your-email@gmail.com',
// //     pass: process.env.EMAIL_PASS || 'your-app-password'
// //   }
// // });

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 465,
//   secure: true, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// // Initialize Database Table with rejection tracking columns
// db.exec(`
//   CREATE TABLE IF NOT EXISTS complaints (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     hostel_name TEXT NOT NULL,
//     kerberos_id TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT NOT NULL,
//     issue_photo TEXT NOT NULL,
//     status TEXT DEFAULT 'Pending',
//     fix_photo TEXT DEFAULT NULL,
//     otp_code TEXT DEFAULT NULL,
//     rejection_count INTEGER DEFAULT 0,
//     last_rejection_reason TEXT DEFAULT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     resolved_at DATETIME DEFAULT NULL
//   )
// `);

// function autoVerifyComplaints() {
//   try {
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = 'Resolved (Auto)' 
//       WHERE status LIKE 'Awaiting%' 
//         AND datetime(resolved_at, '+24 hours') <= datetime('now')
//     `);
//     stmt.run();
//   } catch (err) {
//     console.error('Auto-verify error:', err.message);
//   }
// }

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // Configure Multer Storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'issue_photo') cb(null, 'uploads/issues/');
//     else if (file.fieldname === 'fix_photo') cb(null, 'uploads/fixes/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // --- API ENDPOINTS ---

// // 1. Fetch complaints
// app.get('/api/complaints', (req, res) => {
//   autoVerifyComplaints();
//   const { hostel } = req.query;

//   try {
//     let query = `
//       SELECT id, hostel_name, kerberos_id, category, description, 
//              issue_photo, status, fix_photo, COALESCE(rejection_count, 0) as rejection_count,
//              last_rejection_reason, created_at,
//              CAST((julianday('now') - julianday(resolved_at)) * 24 AS REAL) as hours_since_fix
//       FROM complaints 
//     `;
//     let params = [];

//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = ? `;
//       params.push(hostel);
//     }

//     query += `
//       ORDER BY 
//         CASE 
//           WHEN status = 'Pending' THEN 0 
//           WHEN status LIKE 'Awaiting%' THEN 1 
//           ELSE 2 
//         END,
//         created_at DESC
//     `;

//     const stmt = db.prepare(query);
//     res.json(stmt.all(...params));
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. New Complaint
// app.post('/api/complaints', upload.single('issue_photo'), (req, res) => {
//   try {
//     const { hostel_name, kerberos_id, category, description } = req.body;
//     if (!req.file) return res.status(400).send('Issue photo required');

//     const cleanKerberos = kerberos_id.trim().toLowerCase().replace('@iitd.ac.in', '');

//     const stmt = db.prepare(`
//       INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo)
//       VALUES (?, ?, ?, ?, ?)
//     `);
//     stmt.run(hostel_name, cleanKerberos, category, description, req.file.filename);
//     res.redirect('/');
//   } catch (err) {
//     res.status(500).send('Database error: ' + err.message);
//   }
// });

// // 3. Caretaker Submits Fix
// app.post('/api/complaints/resolve/:id', upload.single('fix_photo'), (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action_type } = req.body;

//     if (!req.file) return res.status(400).json({ error: 'Proof photo required' });

//     const statusStr = `Awaiting Verification (${action_type || 'Repaired'})`;
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = ?, fix_photo = ?, resolved_at = CURRENT_TIMESTAMP 
//       WHERE id = ?
//     `);
//     stmt.run(statusStr, req.file.filename, id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 4. Send OTP
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const complaint = db.prepare('SELECT kerberos_id, category, hostel_name FROM complaints WHERE id = ?').get(id);

//     if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;

//     db.prepare('UPDATE complaints SET otp_code = ? WHERE id = ?').run(generatedOtp, id);

//     const mailOptions = {
//       from: '"Hostel Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `Verification OTP for ${complaint.category} Issue - ${complaint.hostel_name}`,
//       html: `
//         <h3>Hostel Maintenance Fix Verification</h3>
//         <p>The caretaker has marked your <b>${complaint.category}</b> issue as fixed.</p>
//         <p>Your 6-digit OTP to confirm and resolve this ticket is:</p>
//         <h2 style="color: #27ae60; letter-spacing: 2px;">${generatedOtp}</h2>
//         <p>If the work is incomplete, you can reject the fix directly on the portal.</p>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Offline Fallback] OTP for ${studentEmail}: ${generatedOtp}`);
//     }

//     res.json({ success: true, emailSentTo: studentEmail, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. Verify OTP (Or Reject with Reason)
// app.post('/api/complaints/verify-otp/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp, approved, rejection_reason } = req.body;

//     if (!approved) {
//       const reasonText = rejection_reason ? rejection_reason.trim() : 'No reason provided';
//       const stmt = db.prepare(`
//         UPDATE complaints 
//         SET status = 'Pending', 
//             fix_photo = NULL, 
//             resolved_at = NULL, 
//             otp_code = NULL,
//             rejection_count = COALESCE(rejection_count, 0) + 1,
//             last_rejection_reason = ? 
//         WHERE id = ?
//       `);
//       stmt.run(reasonText, id);
//       return res.json({ success: true, status: 'Reopened' });
//     }

//     const complaint = db.prepare('SELECT otp_code FROM complaints WHERE id = ?').get(id);

//     if (!complaint || complaint.otp_code !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid OTP entered. Please try again.' });
//     }

//     const stmt = db.prepare("UPDATE complaints SET status = 'Resolved (Verified)', otp_code = NULL WHERE id = ?");
//     stmt.run(id);

//     res.json({ success: true, status: 'Resolved' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));


// require('dotenv').config();
// const express = require('express');
// const multer = require('multer');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');
// const nodemailer = require('nodemailer');

// const app = express();
// const db = new Database('maintenance.db');

// // Ensure upload directories exist
// fs.mkdirSync('./uploads/issues', { recursive: true });
// fs.mkdirSync('./uploads/fixes', { recursive: true });

// // Configure Email Transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER || 'your-email@gmail.com',
//     pass: process.env.EMAIL_PASS || 'your-app-password'
//   }
// });

// // Caretaker Webmail Generator
// function getCaretakerEmail(hostelName) {
//   const cleanName = hostelName.toLowerCase().replace(/[^a-z]/g, '');
//   return `caretaker${cleanName}@admin.iitd.ac.in`;
// }

// // Initialize Database Table
// db.exec(`
//   CREATE TABLE IF NOT EXISTS complaints (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     hostel_name TEXT NOT NULL,
//     kerberos_id TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT NOT NULL,
//     issue_photo TEXT NOT NULL,
//     status TEXT DEFAULT 'Pending',
//     fix_photo TEXT DEFAULT NULL,
//     otp_code TEXT DEFAULT NULL,
//     rejection_count INTEGER DEFAULT 0,
//     last_rejection_reason TEXT DEFAULT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     resolved_at DATETIME DEFAULT NULL
//   )
// `);

// // Temporary in-memory store for pending complaint submissions awaiting OTP
// const pendingSubmissions = new Map();

// function autoVerifyComplaints() {
//   try {
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = 'Resolved (Auto)' 
//       WHERE status LIKE 'Awaiting%' 
//         AND datetime(resolved_at, '+24 hours') <= datetime('now')
//     `);
//     stmt.run();
//   } catch (err) {
//     console.error('Auto-verify error:', err.message);
//   }
// }

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // Configure Multer Storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'issue_photo') cb(null, 'uploads/issues/');
//     else if (file.fieldname === 'fix_photo') cb(null, 'uploads/fixes/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // --- API ENDPOINTS ---

// // 1. Fetch complaints
// app.get('/api/complaints', (req, res) => {
//   autoVerifyComplaints();
//   const { hostel } = req.query;

//   try {
//     let query = `
//       SELECT id, hostel_name, kerberos_id, category, description, 
//              issue_photo, status, fix_photo, COALESCE(rejection_count, 0) as rejection_count,
//              last_rejection_reason, created_at,
//              CAST((julianday('now') - julianday(resolved_at)) * 24 AS REAL) as hours_since_fix
//       FROM complaints 
//     `;
//     let params = [];

//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = ? `;
//       params.push(hostel);
//     }

//     query += `
//       ORDER BY 
//         CASE 
//           WHEN status = 'Pending' THEN 0 
//           WHEN status LIKE 'Awaiting%' THEN 1 
//           ELSE 2 
//         END,
//         created_at DESC
//     `;

//     const stmt = db.prepare(query);
//     res.json(stmt.all(...params));
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. Step 1: Request OTP for New Complaint Submission
// app.post('/api/complaints/request-submission-otp', upload.single('issue_photo'), async (req, res) => {
//   try {
//     const { hostel_name, kerberos_id, category, description } = req.body;
//     if (!req.file) return res.status(400).json({ error: 'Issue photo required' });

//     const cleanKerberos = kerberos_id.trim().toLowerCase().replace('@iitd.ac.in', '');
//     const studentEmail = `${cleanKerberos}@iitd.ac.in`;
//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 7);

//     // Save submission temporarily
//     pendingSubmissions.set(tempId, {
//       hostel_name,
//       kerberos_id: cleanKerberos,
//       category,
//       description,
//       filename: req.file.filename,
//       otp: generatedOtp
//     });

//     const mailOptions = {
//       from: '"Campus Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `OTP to Submit Maintenance Request - ${hostel_name}`,
//       html: `
//         <h3>Complaint Submission Verification</h3>
//         <p>Your 6-digit OTP to verify and post your maintenance request for <b>${category}</b> is:</p>
//         <h2 style="color: #27ae60; letter-spacing: 2px;">${generatedOtp}</h2>
//         <p>If you did not initiate this request, please ignore this email.</p>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Fallback] Submission OTP for ${studentEmail}: ${generatedOtp}`);
//     }

//     res.json({ success: true, tempId, emailSentTo: studentEmail, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 3. Step 2: Verify OTP and Insert Complaint (Plus notify Caretaker)
// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const { tempId, userOtp } = req.body;
//     const pendingData = pendingSubmissions.get(tempId);

//     if (!pendingData || pendingData.otp !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid or expired OTP.' });
//     }

//     // Insert into DB
//     const stmt = db.prepare(`
//       INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo)
//       VALUES (?, ?, ?, ?, ?)
//     `);
//     stmt.run(pendingData.hostel_name, pendingData.kerberos_id, pendingData.category, pendingData.description, pendingData.filename);

//     // Clean up temporary data
//     pendingSubmissions.delete(tempId);

//     // Notify Caretaker via email
//     const caretakerEmail = getCaretakerEmail(pendingData.hostel_name);
//     const mailOptions = {
//       from: '"Campus Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: caretakerEmail,
//       subject: `🚨 New ${pendingData.category} Request Logged - ${pendingData.hostel_name}`,
//       html: `
//         <h3>New Maintenance Issue Logged</h3>
//         <p>A student has posted a new maintenance complaint for <b>${pendingData.hostel_name}</b>.</p>
//         <ul>
//           <li><b>Category:</b> ${pendingData.category}</li>
//           <li><b>Kerberos ID:</b> ${pendingData.kerberos_id}@iitd.ac.in</li>
//           <li><b>Description:</b> ${pendingData.description}</li>
//         </ul>
//         <p>Please log in to the Caretaker Portal to inspect and resolve the issue.</p>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Fallback] Caretaker Notification sent to ${caretakerEmail}`);
//     }

//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 4. Caretaker Submits Fix
// app.post('/api/complaints/resolve/:id', upload.single('fix_photo'), (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action_type } = req.body;

//     if (!req.file) return res.status(400).json({ error: 'Proof photo required' });

//     const statusStr = `Awaiting Verification (${action_type || 'Repaired'})`;
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = ?, fix_photo = ?, resolved_at = CURRENT_TIMESTAMP 
//       WHERE id = ?
//     `);
//     stmt.run(statusStr, req.file.filename, id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. Send OTP for Verification or Rejection
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { purpose } = req.body; // 'verify' or 'reject'
//     const complaint = db.prepare('SELECT kerberos_id, category, hostel_name FROM complaints WHERE id = ?').get(id);

//     if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;

//     db.prepare('UPDATE complaints SET otp_code = ? WHERE id = ?').run(generatedOtp, id);

//     const actionTitle = purpose === 'reject' ? 'Rejecting Fix' : 'Verifying Fix';

//     const mailOptions = {
//       from: '"Hostel Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `OTP for ${actionTitle} - ${complaint.category} (${complaint.hostel_name})`,
//       html: `
//         <h3>Hostel Maintenance Verification</h3>
//         <p>Your 6-digit OTP for <b>${actionTitle}</b> regarding your ${complaint.category} ticket is:</p>
//         <h2 style="color: #e74c3c; letter-spacing: 2px;">${generatedOtp}</h2>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Fallback] OTP for ${studentEmail}: ${generatedOtp}`);
//     }

//     res.json({ success: true, emailSentTo: studentEmail, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 6. Verify OTP (For Resolution or Rejection)
// app.post('/api/complaints/verify-otp/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp, approved, rejection_reason } = req.body;

//     const complaint = db.prepare('SELECT otp_code FROM complaints WHERE id = ?').get(id);

//     if (!complaint || complaint.otp_code !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid OTP entered. Please try again.' });
//     }

//     if (!approved) {
//       const reasonText = rejection_reason ? rejection_reason.trim() : 'No reason provided';
//       const stmt = db.prepare(`
//         UPDATE complaints 
//         SET status = 'Pending', 
//             fix_photo = NULL, 
//             resolved_at = NULL, 
//             otp_code = NULL,
//             rejection_count = COALESCE(rejection_count, 0) + 1,
//             last_rejection_reason = ? 
//         WHERE id = ?
//       `);
//       stmt.run(reasonText, id);
//       return res.json({ success: true, status: 'Reopened' });
//     }

//     const stmt = db.prepare("UPDATE complaints SET status = 'Resolved (Verified)', otp_code = NULL WHERE id = ?");
//     stmt.run(id);

//     res.json({ success: true, status: 'Resolved' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));



// require('dotenv').config();
// const express = require('express');
// const multer = require('multer');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');
// const nodemailer = require('nodemailer');

// const app = express();
// const db = new Database('maintenance.db');

// // Ensure upload directories exist
// fs.mkdirSync('./uploads/issues', { recursive: true });
// fs.mkdirSync('./uploads/fixes', { recursive: true });

// // Configure Email Transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER || 'your-email@gmail.com',
//     pass: process.env.EMAIL_PASS || 'your-app-password'
//   }
// });

// // TESTING OVERRIDE: Redirect all caretaker notifications to test email
// function getCaretakerEmail(hostelName) {
//   const testEmail = 'aashishraj0310@gmail.com';
//   console.log(`[TEST MODE] Caretaker alert for ${hostelName} routed to: ${testEmail}`);
//   return testEmail;
// }

// // Initialize Database Table
// db.exec(`
//   CREATE TABLE IF NOT EXISTS complaints (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     hostel_name TEXT NOT NULL,
//     kerberos_id TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT NOT NULL,
//     issue_photo TEXT NOT NULL,
//     status TEXT DEFAULT 'Pending',
//     fix_photo TEXT DEFAULT NULL,
//     otp_code TEXT DEFAULT NULL,
//     rejection_count INTEGER DEFAULT 0,
//     last_rejection_reason TEXT DEFAULT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     resolved_at DATETIME DEFAULT NULL
//   )
// `);

// // Temporary in-memory store for pending complaint submissions awaiting OTP
// const pendingSubmissions = new Map();

// function autoVerifyComplaints() {
//   try {
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = 'Resolved (Auto)' 
//       WHERE status LIKE 'Awaiting%' 
//         AND datetime(resolved_at, '+24 hours') <= datetime('now')
//     `);
//     stmt.run();
//   } catch (err) {
//     console.error('Auto-verify error:', err.message);
//   }
// }

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // Configure Multer Storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'issue_photo') cb(null, 'uploads/issues/');
//     else if (file.fieldname === 'fix_photo') cb(null, 'uploads/fixes/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // --- API ENDPOINTS ---

// // 1. Fetch complaints
// app.get('/api/complaints', (req, res) => {
//   autoVerifyComplaints();
//   const { hostel } = req.query;

//   try {
//     let query = `
//       SELECT id, hostel_name, kerberos_id, category, description, 
//              issue_photo, status, fix_photo, COALESCE(rejection_count, 0) as rejection_count,
//              last_rejection_reason, created_at,
//              CAST((julianday('now') - julianday(resolved_at)) * 24 AS REAL) as hours_since_fix
//       FROM complaints 
//     `;
//     let params = [];

//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = ? `;
//       params.push(hostel);
//     }

//     query += `
//       ORDER BY 
//         CASE 
//           WHEN status = 'Pending' THEN 0 
//           WHEN status LIKE 'Awaiting%' THEN 1 
//           ELSE 2 
//         END,
//         created_at DESC
//     `;

//     const stmt = db.prepare(query);
//     res.json(stmt.all(...params));
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. Step 1: Request OTP for New Complaint Submission
// app.post('/api/complaints/request-submission-otp', upload.single('issue_photo'), async (req, res) => {
//   try {
//     const { hostel_name, kerberos_id, category, description } = req.body;
//     if (!req.file) return res.status(400).json({ error: 'Issue photo required' });

//     const cleanKerberos = kerberos_id.trim().toLowerCase().replace('@iitd.ac.in', '');
//     const studentEmail = `${cleanKerberos}@iitd.ac.in`;
//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 7);

//     // Save submission temporarily
//     pendingSubmissions.set(tempId, {
//       hostel_name,
//       kerberos_id: cleanKerberos,
//       category,
//       description,
//       filename: req.file.filename,
//       otp: generatedOtp
//     });

//     const mailOptions = {
//       from: '"Campus Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `OTP to Submit Maintenance Request - ${hostel_name}`,
//       html: `
//         <h3>Complaint Submission Verification</h3>
//         <p>Your 6-digit OTP to verify and post your maintenance request for <b>${category}</b> is:</p>
//         <h2 style="color: #27ae60; letter-spacing: 2px;">${generatedOtp}</h2>
//         <p>If you did not initiate this request, please ignore this email.</p>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Fallback] Submission OTP for ${studentEmail}: ${generatedOtp}`);
//     }

//     res.json({ success: true, tempId, emailSentTo: studentEmail, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 3. Step 2: Verify OTP and Insert Complaint (Plus notify Caretaker)
// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const { tempId, userOtp } = req.body;
//     const pendingData = pendingSubmissions.get(tempId);

//     if (!pendingData || pendingData.otp !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid or expired OTP.' });
//     }

//     // Insert into DB
//     const stmt = db.prepare(`
//       INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo)
//       VALUES (?, ?, ?, ?, ?)
//     `);
//     stmt.run(pendingData.hostel_name, pendingData.kerberos_id, pendingData.category, pendingData.description, pendingData.filename);

//     // Clean up temporary data
//     pendingSubmissions.delete(tempId);

//     // Notify Caretaker via email (routed to test address)
//     const caretakerEmail = getCaretakerEmail(pendingData.hostel_name);
//     const mailOptions = {
//       from: '"Campus Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: caretakerEmail,
//       subject: `🚨 New ${pendingData.category} Request Logged - ${pendingData.hostel_name}`,
//       html: `
//         <h3>New Maintenance Issue Logged</h3>
//         <p>A student has posted a new maintenance complaint for <b>${pendingData.hostel_name}</b>.</p>
//         <ul>
//           <li><b>Category:</b> ${pendingData.category}</li>
//           <li><b>Kerberos ID:</b> ${pendingData.kerberos_id}@iitd.ac.in</li>
//           <li><b>Description:</b> ${pendingData.description}</li>
//         </ul>
//         <p>Please log in to the Caretaker Portal to inspect and resolve the issue.</p>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Fallback] Caretaker Notification sent to ${caretakerEmail}`);
//     }

//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 4. Caretaker Submits Fix
// app.post('/api/complaints/resolve/:id', upload.single('fix_photo'), (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action_type } = req.body;

//     if (!req.file) return res.status(400).json({ error: 'Proof photo required' });

//     const statusStr = `Awaiting Verification (${action_type || 'Repaired'})`;
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = ?, fix_photo = ?, resolved_at = CURRENT_TIMESTAMP 
//       WHERE id = ?
//     `);
//     stmt.run(statusStr, req.file.filename, id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. Send OTP for Verification or Rejection
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { purpose } = req.body; // 'verify' or 'reject'
//     const complaint = db.prepare('SELECT kerberos_id, category, hostel_name FROM complaints WHERE id = ?').get(id);

//     if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;

//     db.prepare('UPDATE complaints SET otp_code = ? WHERE id = ?').run(generatedOtp, id);

//     const actionTitle = purpose === 'reject' ? 'Rejecting Fix' : 'Verifying Fix';

//     const mailOptions = {
//       from: '"Hostel Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `OTP for ${actionTitle} - ${complaint.category} (${complaint.hostel_name})`,
//       html: `
//         <h3>Hostel Maintenance Verification</h3>
//         <p>Your 6-digit OTP for <b>${actionTitle}</b> regarding your ${complaint.category} ticket is:</p>
//         <h2 style="color: #e74c3c; letter-spacing: 2px;">${generatedOtp}</h2>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Fallback] OTP for ${studentEmail}: ${generatedOtp}`);
//     }

//     res.json({ success: true, emailSentTo: studentEmail, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 6. Verify OTP (For Resolution or Rejection)
// // app.post('/api/complaints/verify-otp/:id', (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { userOtp, approved, rejection_reason } = req.body;

// //     const complaint = db.prepare('SELECT otp_code FROM complaints WHERE id = ?').get(id);

// //     if (!complaint || complaint.otp_code !== userOtp.trim()) {
// //       return res.status(400).json({ error: 'Invalid OTP entered. Please try again.' });
// //     }

// //     if (!approved) {
// //       const reasonText = rejection_reason ? rejection_reason.trim() : 'No reason provided';
// //       const stmt = db.prepare(`
// //         UPDATE complaints 
// //         SET status = 'Pending', 
// //             fix_photo = NULL, 
// //             resolved_at = NULL, 
// //             otp_code = NULL,
// //             rejection_count = COALESCE(rejection_count, 0) + 1,
// //             last_rejection_reason = ? 
// //         WHERE id = ?
// //       `);
// //       stmt.run(reasonText, id);
// //       return res.json({ success: true, status: 'Reopened' });
// //     }

// //     const stmt = db.prepare("UPDATE complaints SET status = 'Resolved (Verified)', otp_code = NULL WHERE id = ?");
// //     stmt.run(id);

// //     res.json({ success: true, status: 'Resolved' });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // 6. Verify OTP (For Resolution or Rejection)
// app.post('/api/complaints/verify-otp/:id', async (req, res) => { // Added 'async'
//   try {
//     const { id } = req.params;
//     const { userOtp, approved, rejection_reason } = req.body;

//     const complaint = db.prepare('SELECT otp_code, hostel_name, category, kerberos_id FROM complaints WHERE id = ?').get(id);

//     if (!complaint || complaint.otp_code !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid OTP entered. Please try again.' });
//     }

//     if (!approved) {
//       const reasonText = rejection_reason ? rejection_reason.trim() : 'No reason provided';
//       const stmt = db.prepare(`
//         UPDATE complaints 
//         SET status = 'Pending', 
//             fix_photo = NULL, 
//             resolved_at = NULL, 
//             otp_code = NULL,
//             rejection_count = COALESCE(rejection_count, 0) + 1,
//             last_rejection_reason = ? 
//         WHERE id = ?
//       `);
//       stmt.run(reasonText, id);

//       // --- ADD THIS EMAIL NOTIFICATION FOR REJECTION ---
//       const caretakerEmail = getCaretakerEmail(complaint.hostel_name);
//       const mailOptions = {
//         from: '"Campus Maintenance Portal" <no-reply@iitd.ac.in>',
//         to: caretakerEmail,
//         subject: `⚠️ Fix Rejected for ${complaint.category} Issue - ${complaint.hostel_name}`,
//         html: `
//           <h3>Fix Rejected by Student</h3>
//           <p>The student has rejected the submitted resolution for the <b>${complaint.category}</b> complaint at <b>${complaint.hostel_name}</b>.</p>
//           <ul>
//             <li><b>Student Kerberos:</b> ${complaint.kerberos_id}@iitd.ac.in</li>
//             <li><b>Reason for Rejection:</b> "${reasonText}"</li>
//           </ul>
//           <p>The ticket has been reopened under <b>Pending</b> status in the Caretaker Portal. Please inspect and resolve the issue again.</p>
//         `
//       };

//       try {
//         await transporter.sendMail(mailOptions);
//       } catch (mailErr) {
//         console.log(`[SMTP Fallback] Caretaker Rejection Alert sent to ${caretakerEmail}`);
//       }

//       return res.json({ success: true, status: 'Reopened' });
//     }

//     const stmt = db.prepare("UPDATE complaints SET status = 'Resolved (Verified)', otp_code = NULL WHERE id = ?");
//     stmt.run(id);

//     res.json({ success: true, status: 'Resolved' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));



// require('dotenv').config();
// const express = require('express');
// const multer = require('multer');
// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');
// const nodemailer = require('nodemailer');

// const app = express();
// const db = new Database('maintenance.db');

// // Ensure upload directories exist
// fs.mkdirSync('./uploads/issues', { recursive: true });
// fs.mkdirSync('./uploads/fixes', { recursive: true });

// // Configure Email Transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER || 'your-email@gmail.com',
//     pass: process.env.EMAIL_PASS || 'your-app-password'
//   }
// });

// // TESTING OVERRIDE: Redirect all caretaker emails & OTPs to this test address
// function getCaretakerEmail(hostelName) {
//   const testEmail = 'aashishraj0310@gmail.com';
//   console.log(`[TEST MODE] Caretaker notification for ${hostelName} routed to: ${testEmail}`);
//   return testEmail;
// }

// // Initialize Database Table with pending caretaker upload tracking
// db.exec(`
//   CREATE TABLE IF NOT EXISTS complaints (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     hostel_name TEXT NOT NULL,
//     kerberos_id TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT NOT NULL,
//     issue_photo TEXT NOT NULL,
//     status TEXT DEFAULT 'Pending',
//     fix_photo TEXT DEFAULT NULL,
//     otp_code TEXT DEFAULT NULL,
//     caretaker_otp_code TEXT DEFAULT NULL,
//     rejection_count INTEGER DEFAULT 0,
//     last_rejection_reason TEXT DEFAULT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     resolved_at DATETIME DEFAULT NULL
//   )
// `);

// // Temporary in-memory stores for OTP verification workflows
// const pendingSubmissions = new Map();
// const pendingCaretakerFixes = new Map();

// function autoVerifyComplaints() {
//   try {
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = 'Resolved (Auto)' 
//       WHERE status LIKE 'Awaiting%' 
//         AND datetime(resolved_at, '+24 hours') <= datetime('now')
//     `);
//     stmt.run();
//   } catch (err) {
//     console.error('Auto-verify error:', err.message);
//   }
// }

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // Configure Multer Storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'issue_photo') cb(null, 'uploads/issues/');
//     else if (file.fieldname === 'fix_photo') cb(null, 'uploads/fixes/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // --- API ENDPOINTS ---

// // 1. Fetch complaints
// app.get('/api/complaints', (req, res) => {
//   autoVerifyComplaints();
//   const { hostel } = req.query;

//   try {
//     let query = `
//       SELECT id, hostel_name, kerberos_id, category, description, 
//              issue_photo, status, fix_photo, COALESCE(rejection_count, 0) as rejection_count,
//              last_rejection_reason, created_at,
//              CAST((julianday('now') - julianday(resolved_at)) * 24 AS REAL) as hours_since_fix
//       FROM complaints 
//     `;
//     let params = [];

//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = ? `;
//       params.push(hostel);
//     }

//     query += `
//       ORDER BY 
//         CASE 
//           WHEN status = 'Pending' THEN 0 
//           WHEN status LIKE 'Awaiting%' THEN 1 
//           ELSE 2 
//         END,
//         created_at DESC
//     `;

//     const stmt = db.prepare(query);
//     res.json(stmt.all(...params));
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. Student Step 1: Request OTP for New Complaint Submission
// app.post('/api/complaints/request-submission-otp', upload.single('issue_photo'), async (req, res) => {
//   try {
//     const { hostel_name, kerberos_id, category, description } = req.body;
//     if (!req.file) return res.status(400).json({ error: 'Issue photo required' });

//     const cleanKerberos = kerberos_id.trim().toLowerCase().replace('@iitd.ac.in', '');
//     const studentEmail = `${cleanKerberos}@iitd.ac.in`;
//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 7);

//     pendingSubmissions.set(tempId, {
//       hostel_name,
//       kerberos_id: cleanKerberos,
//       category,
//       description,
//       filename: req.file.filename,
//       otp: generatedOtp
//     });

//     const mailOptions = {
//       from: '"Campus Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `OTP to Submit Maintenance Request - ${hostel_name}`,
//       html: `
//         <h3>Complaint Submission Verification</h3>
//         <p>Your 6-digit OTP to verify and post your maintenance request for <b>${category}</b> is:</p>
//         <h2 style="color: #27ae60; letter-spacing: 2px;">${generatedOtp}</h2>
//         <p>If you did not initiate this request, please ignore this email.</p>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Fallback] Submission OTP for ${studentEmail}: ${generatedOtp}`);
//     }

//     res.json({ success: true, tempId, emailSentTo: studentEmail, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 3. Student Step 2: Verify OTP and Insert Complaint (Plus notify Caretaker)
// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const { tempId, userOtp } = req.body;
//     const pendingData = pendingSubmissions.get(tempId);

//     if (!pendingData || pendingData.otp !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid or expired OTP.' });
//     }

//     const stmt = db.prepare(`
//       INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo)
//       VALUES (?, ?, ?, ?, ?)
//     `);
//     stmt.run(pendingData.hostel_name, pendingData.kerberos_id, pendingData.category, pendingData.description, pendingData.filename);

//     pendingSubmissions.delete(tempId);

//     // Notify Caretaker via email
//     const caretakerEmail = getCaretakerEmail(pendingData.hostel_name);
//     const mailOptions = {
//       from: '"Campus Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: caretakerEmail,
//       subject: `🚨 New ${pendingData.category} Request Logged - ${pendingData.hostel_name}`,
//       html: `
//         <h3>New Maintenance Issue Logged</h3>
//         <p>A student has posted a new maintenance complaint for <b>${pendingData.hostel_name}</b>.</p>
//         <ul>
//           <li><b>Category:</b> ${pendingData.category}</li>
//           <li><b>Kerberos ID:</b> ${pendingData.kerberos_id}@iitd.ac.in</li>
//           <li><b>Description:</b> ${pendingData.description}</li>
//         </ul>
//         <p>Please log in to the Caretaker Portal to inspect and resolve the issue.</p>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Fallback] Caretaker Notification sent to ${caretakerEmail}`);
//     }

//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 4. Caretaker Step 1: Upload Proof Photo & Request OTP to Submit Fix
// app.post('/api/complaints/request-caretaker-otp/:id', upload.single('fix_photo'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action_type } = req.body;

//     if (!req.file) return res.status(400).json({ error: 'Proof photo required' });

//     const complaint = db.prepare('SELECT hostel_name, category FROM complaints WHERE id = ?').get(id);
//     if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const caretakerEmail = getCaretakerEmail(complaint.hostel_name);

//     pendingCaretakerFixes.set(id.toString(), {
//       action_type: action_type || 'Repaired',
//       fix_photo: req.file.filename,
//       otp: generatedOtp
//     });

//     const mailOptions = {
//       from: '"Campus Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: caretakerEmail,
//       subject: `Caretaker Verification OTP - ${complaint.category} (${complaint.hostel_name})`,
//       html: `
//         <h3>Caretaker Action Verification</h3>
//         <p>You are marking the <b>${complaint.category}</b> issue for <b>${complaint.hostel_name}</b> as fixed.</p>
//         <p>Your 6-digit OTP to confirm this resolution is:</p>
//         <h2 style="color: #2980b9; letter-spacing: 2px;">${generatedOtp}</h2>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Fallback] Caretaker OTP for ${caretakerEmail}: ${generatedOtp}`);
//     }

//     res.json({ success: true, emailSentTo: caretakerEmail, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. Caretaker Step 2: Verify OTP and Move Ticket to "Awaiting Verification"
// app.post('/api/complaints/verify-caretaker-otp/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp } = req.body;

//     const pendingFix = pendingCaretakerFixes.get(id.toString());

//     if (!pendingFix || pendingFix.otp !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid or expired Caretaker OTP.' });
//     }

//     const statusStr = `Awaiting Verification (${pendingFix.action_type})`;
//     const stmt = db.prepare(`
//       UPDATE complaints 
//       SET status = ?, fix_photo = ?, resolved_at = CURRENT_TIMESTAMP 
//       WHERE id = ?
//     `);
//     stmt.run(statusStr, pendingFix.fix_photo, id);

//     pendingCaretakerFixes.delete(id.toString());

//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 6. Student Step 1: Send OTP for Fix Verification or Rejection
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { purpose } = req.body; // 'verify' or 'reject'
//     const complaint = db.prepare('SELECT kerberos_id, category, hostel_name FROM complaints WHERE id = ?').get(id);

//     if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;

//     db.prepare('UPDATE complaints SET otp_code = ? WHERE id = ?').run(generatedOtp, id);

//     const actionTitle = purpose === 'reject' ? 'Rejecting Fix' : 'Verifying Fix';

//     const mailOptions = {
//       from: '"Hostel Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `OTP for ${actionTitle} - ${complaint.category} (${complaint.hostel_name})`,
//       html: `
//         <h3>Hostel Maintenance Verification</h3>
//         <p>Your 6-digit OTP for <b>${actionTitle}</b> regarding your ${complaint.category} ticket is:</p>
//         <h2 style="color: #e74c3c; letter-spacing: 2px;">${generatedOtp}</h2>
//       `
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//     } catch (mailErr) {
//       console.log(`[SMTP Fallback] OTP for ${studentEmail}: ${generatedOtp}`);
//     }

//     res.json({ success: true, emailSentTo: studentEmail, otpDemo: generatedOtp });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 7. Student Step 2: Verify OTP (For Resolution or Rejection + Email Caretaker if Rejected)
// app.post('/api/complaints/verify-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp, approved, rejection_reason } = req.body;

//     const complaint = db.prepare('SELECT otp_code, hostel_name, category, kerberos_id FROM complaints WHERE id = ?').get(id);

//     if (!complaint || complaint.otp_code !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid OTP entered. Please try again.' });
//     }

//     if (!approved) {
//       const reasonText = rejection_reason ? rejection_reason.trim() : 'No reason provided';
//       const stmt = db.prepare(`
//         UPDATE complaints 
//         SET status = 'Pending', 
//             fix_photo = NULL, 
//             resolved_at = NULL, 
//             otp_code = NULL,
//             rejection_count = COALESCE(rejection_count, 0) + 1,
//             last_rejection_reason = ? 
//         WHERE id = ?
//       `);
//       stmt.run(reasonText, id);

//       // Caretaker Rejection Email Notification
//       const caretakerEmail = getCaretakerEmail(complaint.hostel_name);
//       const mailOptions = {
//         from: '"Campus Maintenance Portal" <no-reply@iitd.ac.in>',
//         to: caretakerEmail,
//         subject: `⚠️ Fix Rejected for ${complaint.category} Issue - ${complaint.hostel_name}`,
//         html: `
//           <h3>Fix Rejected by Student</h3>
//           <p>The student has rejected the resolution for <b>${complaint.category}</b> at <b>${complaint.hostel_name}</b>.</p>
//           <ul>
//             <li><b>Student Kerberos:</b> ${complaint.kerberos_id}@iitd.ac.in</li>
//             <li><b>Reason:</b> "${reasonText}"</li>
//           </ul>
//           <p>The complaint is reopened under Pending status.</p>
//         `
//       };

//       try {
//         await transporter.sendMail(mailOptions);
//       } catch (mailErr) {
//         console.log(`[SMTP Fallback] Caretaker Rejection Alert sent to ${caretakerEmail}`);
//       }

//       return res.json({ success: true, status: 'Reopened' });
//     }

//     const stmt = db.prepare("UPDATE complaints SET status = 'Resolved (Verified)', otp_code = NULL WHERE id = ?");
//     stmt.run(id);

//     res.json({ success: true, status: 'Resolved' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));




// require('dotenv').config();
// const express = require('express');
// const multer = require('multer');
// const { v2: cloudinary } = require('cloudinary');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const { Pool } = require('pg');
// const Database = require('better-sqlite3');
// const path = require('path');
// const nodemailer = require('nodemailer');

// const app = express();

// // --- 1. CONFIGURE CLOUDINARY STORAGE (PERMANENT PHOTOS) ---
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'hostel_maintenance',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
//   }
// });
// const upload = multer({ storage });

// // --- 2. CONFIGURE DATABASE (PG for Cloud, SQLite for local fallback) ---
// const isPostgres = !!process.env.DATABASE_URL;
// let pgPool, sqliteDb;

// if (isPostgres) {
//   pgPool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     ssl: { rejectUnauthorized: false }
//   });
// } else {
//   sqliteDb = new Database('maintenance.db');
// }

// // Initialize Database Tables
// async function initDb() {
//   const schema = `
//     CREATE TABLE IF NOT EXISTS complaints (
//       id SERIAL PRIMARY KEY,
//       hostel_name TEXT NOT NULL,
//       kerberos_id TEXT NOT NULL,
//       category TEXT NOT NULL,
//       description TEXT NOT NULL,
//       issue_photo TEXT NOT NULL,
//       status TEXT DEFAULT 'Pending',
//       fix_photo TEXT DEFAULT NULL,
//       otp_code TEXT DEFAULT NULL,
//       caretaker_otp_code TEXT DEFAULT NULL,
//       rejection_count INTEGER DEFAULT 0,
//       last_rejection_reason TEXT DEFAULT NULL,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       resolved_at TIMESTAMP DEFAULT NULL
//     )
//   `;
//   if (isPostgres) {
//     await pgPool.query(schema);
//   } else {
//     sqliteDb.exec(schema.replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT'));
//   }
// }
// initDb();

// // Email Setup
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// function getCaretakerEmail(hostelName) {
//   return 'aashishraj0310@gmail.com'; // Change back to caretaker<hostel>@admin.iitd.ac.in for production
// }

// const pendingSubmissions = new Map();
// const pendingCaretakerFixes = new Map();

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'public')));

// // --- API ENDPOINTS ---

// // Fetch Complaints
// app.get('/api/complaints', async (req, res) => {
//   const { hostel } = req.query;
//   try {
//     let rows;
//     if (isPostgres) {
//       let query = `SELECT *, COALESCE(rejection_count, 0) as rejection_count,
//                    EXTRACT(EPOCH FROM (NOW() - resolved_at))/3600 as hours_since_fix
//                    FROM complaints`;
//       let params = [];
//       if (hostel && hostel !== 'ALL') {
//         query += ` WHERE hostel_name = $1`;
//         params.push(hostel);
//       }
//       query += ` ORDER BY CASE WHEN status = 'Pending' THEN 0 WHEN status LIKE 'Awaiting%' THEN 1 ELSE 2 END, created_at DESC`;
//       const result = await pgPool.query(query, params);
//       rows = result.rows;
//     } else {
//       let query = `SELECT id, hostel_name, kerberos_id, category, description, issue_photo, status, fix_photo, 
//                    COALESCE(rejection_count, 0) as rejection_count, last_rejection_reason, created_at,
//                    CAST((julianday('now') - julianday(resolved_at)) * 24 AS REAL) as hours_since_fix
//                    FROM complaints`;
//       let params = [];
//       if (hostel && hostel !== 'ALL') {
//         query += ` WHERE hostel_name = ?`;
//         params.push(hostel);
//       }
//       query += ` ORDER BY CASE WHEN status = 'Pending' THEN 0 WHEN status LIKE 'Awaiting%' THEN 1 ELSE 2 END, created_at DESC`;
//       rows = sqliteDb.prepare(query).all(...params);
//     }
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Student Submission Step 1 (Photo Uploads directly to Cloudinary)
// app.post('/api/complaints/request-submission-otp', upload.single('issue_photo'), async (req, res) => {
//   try {
//     const { hostel_name, kerberos_id, category, description } = req.body;
//     if (!req.file) return res.status(400).json({ error: 'Issue photo required' });

//     const cleanKerberos = kerberos_id.trim().toLowerCase().replace('@iitd.ac.in', '');
//     const studentEmail = `${cleanKerberos}@iitd.ac.in`;
//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 7);

//     pendingSubmissions.set(tempId, {
//       hostel_name,
//       kerberos_id: cleanKerberos,
//       category,
//       description,
//       filename: req.file.path, // Permanent Cloudinary URL
//       otp: generatedOtp
//     });

//     await transporter.sendMail({
//       from: '"Campus Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `OTP to Submit Maintenance Request - ${hostel_name}`,
//       html: `<h3>Your OTP is: ${generatedOtp}</h3>`
//     });

//     res.json({ success: true, tempId, emailSentTo: studentEmail });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Student Submission Step 2 (Database Insert)
// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const { tempId, userOtp } = req.body;
//     const pendingData = pendingSubmissions.get(tempId);

//     if (!pendingData || pendingData.otp !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid or expired OTP.' });
//     }

//     if (isPostgres) {
//       await pgPool.query(
//         `INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo) VALUES ($1, $2, $3, $4, $5)`,
//         [pendingData.hostel_name, pendingData.kerberos_id, pendingData.category, pendingData.description, pendingData.filename]
//       );
//     } else {
//       sqliteDb.prepare(
//         `INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo) VALUES (?, ?, ?, ?, ?)`
//       ).run(pendingData.hostel_name, pendingData.kerberos_id, pendingData.category, pendingData.description, pendingData.filename);
//     }

//     pendingSubmissions.delete(tempId);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Caretaker Fix Step 1 (Upload Fix Photo to Cloudinary)
// app.post('/api/complaints/request-caretaker-otp/:id', upload.single('fix_photo'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action_type } = req.body;
//     if (!req.file) return res.status(400).json({ error: 'Proof photo required' });

//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const caretakerEmail = getCaretakerEmail();

//     pendingCaretakerFixes.set(id.toString(), {
//       action_type: action_type || 'Repaired',
//       fix_photo: req.file.path, // Permanent Cloudinary URL
//       otp: generatedOtp
//     });

//     await transporter.sendMail({
//       from: '"Campus Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: caretakerEmail,
//       subject: `Caretaker OTP - Complaint #${id}`,
//       html: `<h3>Your Caretaker Fix OTP is: ${generatedOtp}</h3>`
//     });

//     res.json({ success: true, emailSentTo: caretakerEmail });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Caretaker Fix Step 2
// app.post('/api/complaints/verify-caretaker-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp } = req.body;
//     const pendingFix = pendingCaretakerFixes.get(id.toString());

//     if (!pendingFix || pendingFix.otp !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid Caretaker OTP.' });
//     }

//     const statusStr = `Awaiting Verification (${pendingFix.action_type})`;
//     if (isPostgres) {
//       await pgPool.query(
//         `UPDATE complaints SET status = $1, fix_photo = $2, resolved_at = CURRENT_TIMESTAMP WHERE id = $3`,
//         [statusStr, pendingFix.fix_photo, id]
//       );
//     } else {
//       sqliteDb.prepare(`UPDATE complaints SET status = ?, fix_photo = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?`)
//         .run(statusStr, pendingFix.fix_photo, id);
//     }

//     pendingCaretakerFixes.delete(id.toString());
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Student Verification / Rejection OTP
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { purpose } = req.body;
    
//     let complaint;
//     if (isPostgres) {
//       const result = await pgPool.query('SELECT kerberos_id, category, hostel_name FROM complaints WHERE id = $1', [id]);
//       complaint = result.rows[0];
//     } else {
//       complaint = sqliteDb.prepare('SELECT kerberos_id, category, hostel_name FROM complaints WHERE id = ?').get(id);
//     }

//     if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

//     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;

//     if (isPostgres) {
//       await pgPool.query('UPDATE complaints SET otp_code = $1 WHERE id = $2', [generatedOtp, id]);
//     } else {
//       sqliteDb.prepare('UPDATE complaints SET otp_code = ? WHERE id = ?').run(generatedOtp, id);
//     }

//     await transporter.sendMail({
//       from: '"Hostel Maintenance Portal" <no-reply@iitd.ac.in>',
//       to: studentEmail,
//       subject: `OTP for ${purpose === 'reject' ? 'Rejection' : 'Verification'}`,
//       html: `<h3>Your OTP is: ${generatedOtp}</h3>`
//     });

//     res.json({ success: true, emailSentTo: studentEmail });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Verify OTP (Approve / Reject)
// app.post('/api/complaints/verify-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp, approved, rejection_reason } = req.body;

//     let complaint;
//     if (isPostgres) {
//       const result = await pgPool.query('SELECT otp_code, hostel_name, category, kerberos_id FROM complaints WHERE id = $1', [id]);
//       complaint = result.rows[0];
//     } else {
//       complaint = sqliteDb.prepare('SELECT otp_code, hostel_name, category, kerberos_id FROM complaints WHERE id = ?').get(id);
//     }

//     if (!complaint || complaint.otp_code !== userOtp.trim()) {
//       return res.status(400).json({ error: 'Invalid OTP entered.' });
//     }

//     if (!approved) {
//       const reasonText = rejection_reason ? rejection_reason.trim() : 'No reason provided';
//       if (isPostgres) {
//         await pgPool.query(
//           `UPDATE complaints SET status = 'Pending', fix_photo = NULL, resolved_at = NULL, otp_code = NULL,
//            rejection_count = COALESCE(rejection_count, 0) + 1, last_rejection_reason = $1 WHERE id = $2`,
//           [reasonText, id]
//         );
//       } else {
//         sqliteDb.prepare(
//           `UPDATE complaints SET status = 'Pending', fix_photo = NULL, resolved_at = NULL, otp_code = NULL,
//            rejection_count = COALESCE(rejection_count, 0) + 1, last_rejection_reason = ? WHERE id = ?`
//         ).run(reasonText, id);
//       }
//       return res.json({ success: true, status: 'Reopened' });
//     }

//     if (isPostgres) {
//       await pgPool.query("UPDATE complaints SET status = 'Resolved (Verified)', otp_code = NULL WHERE id = $1", [id]);
//     } else {
//       sqliteDb.prepare("UPDATE complaints SET status = 'Resolved (Verified)', otp_code = NULL WHERE id = ?").run(id);
//     }

//     res.json({ success: true, status: 'Resolved' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// const express = require('express');
// const { Pool } = require('pg');
// const nodemailer = require('nodemailer');
// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');
// const path = require('path');

// const app = express();

// // --- Express Body Limits ---
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ limit: '10mb', extended: true }));
// app.use(express.static(path.join(__dirname, '../public')));

// // --- PostgreSQL Pool Setup (Serverless Friendly) ---
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
//   max: 10,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 5000
// });

// pool.on('error', (err) => {
//   console.error('Unexpected error on idle PostgreSQL client:', err.message || err);
// });

// // --- Cloudinary Config ---
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // --- Multer Memory Storage (Required for Vercel) ---
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5 MB image size limit
// });

// // Helper: Upload Buffer directly to Cloudinary
// const uploadToCloudinary = (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'complaints' },
//       (error, result) => {
//         if (result) resolve(result.secure_url);
//         else reject(error);
//       }
//     );
//     stream.end(fileBuffer);
//   });
// };

// // --- Nodemailer Transporter ---
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// function getCaretakerEmail(hostelName) {
//   return 'aashishraj0310@gmail.com'; // Replace with actual email mapping when ready
// }

// const pendingSubmissions = new Map();
// const pendingCaretakerFixes = new Map();

// // --- API ENDPOINTS ---

// // GET Complaints
// app.get('/api/complaints', async (req, res) => {
//   const { hostel } = req.query;
//   try {
//     let query = `SELECT *, COALESCE(rejection_count, 0) as rejection_count,
//                  EXTRACT(EPOCH FROM (NOW() - resolved_at))/3600 as hours_since_fix
//                  FROM complaints`;
//     let params = [];
//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = $1`;
//       params.push(hostel);
//     }
//     query += ` ORDER BY created_at DESC`;
//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching complaints:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to fetch complaints' });
//   }
// });

// // POST Request Submission OTP
// // app.post('/api/complaints/request-submission-otp', upload.single('photo'), async (req, res) => {
// //   try {
// //     const { hostel, kerberos, category, description } = req.body;

// //     if (!hostel || !kerberos || !category || !description) {
// //       return res.status(400).json({ error: 'Missing required fields' });
// //     }

// //     let photoUrl = null;
// //     if (req.file) {
// //       photoUrl = await uploadToCloudinary(req.file.buffer);
// //     }

// // POST Request Submission OTP
// app.post('/api/complaints/request-submission-otp', upload.any(), async (req, res) => {
//   try {
//     const hostel = req.body.hostel || req.body.hostel_name;
//     const kerberos = req.body.kerberos || req.body.kerberos_id;
//     const category = req.body.category;
//     const description = req.body.description;

//     if (!hostel || !kerberos || !category || !description) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     let photoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) {
//       photoUrl = await uploadToCloudinary(file.buffer);
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const studentEmail = `${kerberos.trim().toLowerCase()}@iitd.ac.in`;

//     // Store normalized Kerberos key
//     pendingSubmissions.set(kerberos.trim().toLowerCase(), {
//       otp,
//       hostel,
//       kerberos,
//       category,
//       description,
//       photoUrl,
//       createdAt: Date.now()
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: 'OTP for Complaint Submission',
//       text: `Your OTP for submitting the complaint is: ${otp}`
//     });

//     // Return studentEmail and kerberos explicitly so frontend UI displays properly
//     res.json({ 
//       success: true,
//       message: 'OTP sent successfully', 
//       email: studentEmail, 
//       studentEmail: studentEmail,
//       kerberos: kerberos.trim().toLowerCase()
//     });
//   } catch (err) {
//     console.error("OTP Error Details:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// // POST Verify Submission OTP
// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const { kerberos, otp } = req.body;
//     const cleanKerberos = kerberos ? kerberos.trim().toLowerCase() : '';
//     const cleanOtp = otp ? otp.toString().trim() : '';

//     const pending = pendingSubmissions.get(cleanKerberos);

//     if (!pending || pending.otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     const result = await pool.query(
//       `INSERT INTO complaints (hostel_name, kerberos_id, category, description, photo_url, status)
//        VALUES ($1, $2, $3, $4, $5, 'OPEN') RETURNING *`,
//       [pending.hostel, pending.kerberos, pending.category, pending.description, pending.photoUrl]
//     );

//     pendingSubmissions.delete(cleanKerberos);
//     res.json({ success: true, message: 'Complaint created successfully', complaint: result.rows[0] });
//   } catch (err) {
//     console.error("Verification Error:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// module.exports = app;


// const express = require('express');
// const { Pool } = require('pg');
// const nodemailer = require('nodemailer');
// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');
// const path = require('path');

// const app = express();

// // --- Express Body Limits ---
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ limit: '10mb', extended: true }));
// app.use(express.static(path.join(__dirname, '../public')));

// // --- PostgreSQL Pool Setup (Serverless Friendly) ---
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false
//   },
//   max: 1, // Keep max connections low for Vercel serverless
//   connectionTimeoutMillis: 10000 // Give it 10s to connect
// });

// pool.on('error', (err) => {
//   console.error('Unexpected error on idle PostgreSQL client:', err.message || err);
// });

// // Helper: Ensure database table for OTP storage exists
// const initDb = async () => {
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS pending_otps (
//         kerberos VARCHAR(50) PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         hostel VARCHAR(100) NOT NULL,
//         category VARCHAR(100) NOT NULL,
//         description TEXT NOT NULL,
//         photo_url TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);
//     console.log("Database initialized successfully!");
//   } catch (err) {
//     console.error("Failed to initialize pending_otps table:", err.message || err);
//   }
// };
// initDb();

// // --- Cloudinary Config ---
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // --- Multer Memory Storage (Serverless safe) ---
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
// });

// // Helper: Upload Buffer directly to Cloudinary
// const uploadToCloudinary = (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'complaints' },
//       (error, result) => {
//         if (result) resolve(result.secure_url);
//         else reject(error);
//       }
//     );
//     stream.end(fileBuffer);
//   });
// };

// // --- Nodemailer Transporter ---
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// // --- Caretaker Email Mapping ---
// function getCaretakerEmail(hostelName) {
//   const map = {
//     'Aravali': 'aashishraj0310@gmail.com',
//   };
//   return map[hostelName] || 'aashishraj0310@gmail.com';
// }

// // --- API ENDPOINTS ---

// // GET Complaints
// app.get('/api/complaints', async (req, res) => {
//   const { hostel } = req.query;
//   try {
//     let query = `SELECT *, COALESCE(rejection_count, 0) as rejection_count,
//                  EXTRACT(EPOCH FROM (NOW() - resolved_at))/3600 as hours_since_fix
//                  FROM complaints`;
//     let params = [];
//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = $1`;
//       params.push(hostel);
//     }
//     query += ` ORDER BY created_at DESC`;
//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching complaints:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to fetch complaints' });
//   }
// });

// // POST Request Submission OTP
// app.post('/api/complaints/request-submission-otp', upload.any(), async (req, res) => {
//   try {
//     const hostel = req.body.hostel || req.body.hostel_name;
//     const kerberos = req.body.kerberos || req.body.kerberos_id;
//     const category = req.body.category;
//     const description = req.body.description;

//     if (!hostel || !kerberos || !category || !description) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     let photoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) {
//       photoUrl = await uploadToCloudinary(file.buffer);
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const cleanKerberos = kerberos.trim().toLowerCase();
//     const studentEmail = `${cleanKerberos}@iitd.ac.in`;

//     // Save or update pending submission in PostgreSQL table
//     await pool.query(
//       `INSERT INTO pending_otps (kerberos, otp, hostel, category, description, photo_url)
//        VALUES ($1, $2, $3, $4, $5, $6)
//        ON CONFLICT (kerberos) DO UPDATE 
//        SET otp = EXCLUDED.otp, hostel = EXCLUDED.hostel, category = EXCLUDED.category, 
//            description = EXCLUDED.description, photo_url = EXCLUDED.photo_url, created_at = CURRENT_TIMESTAMP`,
//       [cleanKerberos, otp, hostel, category, description, photoUrl]
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: 'OTP for Complaint Submission',
//       text: `Your OTP for submitting the complaint is: ${otp}`
//     });

//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       emailSentTo: studentEmail,
//       studentEmail: studentEmail,
//       email : studentEmail,
//       kerberos: cleanKerberos
//     });
//   } catch (err) {
//     console.error("OTP Error Details:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// // POST Verify Submission OTP
// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const kerberos = req.body.kerberos || req.body.kerberos_id || req.body.username;
//     const otp = req.body.otp || req.body.code || req.body.otpCode;

//     const cleanOtp = otp ? otp.toString().trim() : '';
//     let cleanKerberos = kerberos ? kerberos.toString().trim().toLowerCase() : '';

//     if (!cleanOtp) {
//       return res.status(400).json({ error: 'OTP code is required' });
//     }

//     let pending = null;

//     // 1. If kerberos ID was provided by frontend, look up by kerberos
//     if (cleanKerberos) {
//       const pendingResult = await pool.query(
//         `SELECT * FROM pending_otps WHERE kerberos = $1`,
//         [cleanKerberos]
//       );
//       if (pendingResult.rows.length > 0) {
//         pending = pendingResult.rows[0];
//       }
//     }

//     // 2. Fallback: If kerberos was empty or missing, find pending record by matching OTP directly
//     if (!pending) {
//       const pendingByOtp = await pool.query(
//         `SELECT * FROM pending_otps WHERE otp = $1 ORDER BY created_at DESC LIMIT 1`,
//         [cleanOtp]
//       );
//       if (pendingByOtp.rows.length > 0) {
//         pending = pendingByOtp.rows[0];
//         cleanKerberos = pending.kerberos;
//       }
//     }

//     // If still no record found or OTP doesn't match
//     if (!pending || pending.otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     // Insert new complaint into complaints table
//     const result = await pool.query(
//       `INSERT INTO complaints (hostel_name, kerberos_id, category, description, photo_url, status)
//        VALUES ($1, $2, $3, $4, $5, 'OPEN') RETURNING *`,
//       [pending.hostel, pending.kerberos, pending.category, pending.description, pending.photo_url]
//     );

//     // Clean up used OTP record from database
//     await pool.query(`DELETE FROM pending_otps WHERE kerberos = $1`, [cleanKerberos]);

//     // Send email notification to caretaker
//     const caretakerEmail = getCaretakerEmail(pending.hostel);
//     transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `New Maintenance Request: ${pending.hostel}`,
//       text: `A new complaint has been lodged by ${pending.kerberos}:\n\nCategory: ${pending.category}\nDescription: ${pending.description}`
//     }).catch(err => console.error("Caretaker mail error:", err));

//     return res.json({ success: true, message: 'Complaint created successfully', complaint: result.rows[0] });
//   } catch (err) {
//     console.error("Verification Error:", err.message || err);
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// module.exports = app;


// const express = require('express');
// const { Pool } = require('pg');
// const nodemailer = require('nodemailer');
// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');
// const path = require('path');

// const app = express();

// // --- Express Body Limits ---
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ limit: '10mb', extended: true }));
// app.use(express.static(path.join(__dirname, '../public')));

// // --- PostgreSQL Pool Setup (Serverless Friendly) ---
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false
//   },
//   max: 1,
//   connectionTimeoutMillis: 10000
// });

// pool.on('error', (err) => {
//   console.error('Unexpected error on idle PostgreSQL client:', err.message || err);
// });

// // Helper: Ensure database table for OTP storage exists
// const initDb = async () => {
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS pending_otps (
//         kerberos VARCHAR(50) PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         hostel VARCHAR(100) NOT NULL,
//         category VARCHAR(100) NOT NULL,
//         description TEXT NOT NULL,
//         photo_url TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS issue_photo TEXT;
//     `);

//     console.log("Database initialized successfully!");
//   } catch (err) {
//     console.error("Failed to initialize pending_otps table:", err.message || err);
//   }
// };
// initDb();

// // --- Cloudinary Config ---
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // --- Multer Memory Storage (Serverless safe) ---
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
// });

// // Helper: Upload Buffer directly to Cloudinary
// const uploadToCloudinary = (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'complaints' },
//       (error, result) => {
//         if (result) resolve(result.secure_url);
//         else reject(error);
//       }
//     );
//     stream.end(fileBuffer);
//   });
// };

// // --- Nodemailer Transporter ---
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// // --- Caretaker Email Mapping ---
// function getCaretakerEmail(hostelName) {
//   const map = {
//     'Aravali': 'aashishraj0310@gmail.com',
//   };
//   return map[hostelName] || 'aashishraj0310@gmail.com';
// }

// // --- API ENDPOINTS ---

// // GET Complaints
// app.get('/api/complaints', async (req, res) => {
//   const { hostel } = req.query;
//   try {
//     let query = `SELECT *, COALESCE(rejection_count, 0) as rejection_count,
//                  EXTRACT(EPOCH FROM (NOW() - resolved_at))/3600 as hours_since_fix
//                  FROM complaints`;
//     let params = [];
//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = $1`;
//       params.push(hostel);
//     }
//     query += ` ORDER BY created_at DESC`;
//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching complaints:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to fetch complaints' });
//   }
// });

// // POST Request Submission OTP
// app.post('/api/complaints/request-submission-otp', upload.any(), async (req, res) => {
//   try {
//     const hostel = req.body.hostel || req.body.hostel_name;
//     const kerberos = req.body.kerberos || req.body.kerberos_id;
//     const category = req.body.category;
//     const description = req.body.description;

//     if (!hostel || !kerberos || !category || !description) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     let photoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) {
//       photoUrl = await uploadToCloudinary(file.buffer);
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const cleanKerberos = kerberos.trim().toLowerCase();
//     const studentEmail = `${cleanKerberos}@iitd.ac.in`;

//     // Save or update pending submission in PostgreSQL table
//     await pool.query(
//       `INSERT INTO pending_otps (kerberos, otp, hostel, category, description, photo_url)
//        VALUES ($1, $2, $3, $4, $5, $6)
//        ON CONFLICT (kerberos) DO UPDATE 
//        SET otp = EXCLUDED.otp, hostel = EXCLUDED.hostel, category = EXCLUDED.category, 
//            description = EXCLUDED.description, photo_url = EXCLUDED.photo_url, created_at = CURRENT_TIMESTAMP`,
//       [cleanKerberos, otp, hostel, category, description, photoUrl]
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: 'OTP for Complaint Submission',
//       text: `Your OTP for submitting the complaint is: ${otp}`
//     });

//     // Provide all frontend object aliases (tempId, emailSentTo, studentEmail, kerberos)
//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       tempId: cleanKerberos, 
//       emailSentTo: studentEmail,
//       studentEmail: studentEmail,
//       email: studentEmail,
//       kerberos: cleanKerberos
//     });
//   } catch (err) {
//     console.error("OTP Error Details:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// // POST Verify Submission OTP
// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     // Read userOtp, otp, tempId, kerberos from frontend body payload
//     const otp = req.body.userOtp || req.body.otp || req.body.code || req.body.otpCode;
//     const kerberos = req.body.tempId || req.body.kerberos || req.body.kerberos_id || req.body.username;

//     const cleanOtp = otp ? otp.toString().trim() : '';
//     let cleanKerberos = kerberos ? kerberos.toString().trim().toLowerCase() : '';

//     if (!cleanOtp) {
//       return res.status(400).json({ error: 'OTP code is required' });
//     }

//     let pending = null;

//     // 1. Look up by kerberos / tempId key
//     if (cleanKerberos) {
//       const pendingResult = await pool.query(
//         `SELECT * FROM pending_otps WHERE kerberos = $1`,
//         [cleanKerberos]
//       );
//       if (pendingResult.rows.length > 0) {
//         pending = pendingResult.rows[0];
//       }
//     }

//     // 2. Fallback: Lookup by matching OTP value directly
//     if (!pending) {
//       const pendingByOtp = await pool.query(
//         `SELECT * FROM pending_otps WHERE otp = $1 ORDER BY created_at DESC LIMIT 1`,
//         [cleanOtp]
//       );
//       if (pendingByOtp.rows.length > 0) {
//         pending = pendingByOtp.rows[0];
//         cleanKerberos = pending.kerberos;
//       }
//     }

//     // Validation check
//     if (!pending || pending.otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     // Insert new complaint into complaints table
//     const result = await pool.query(
//       `INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo, status)
//        VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING *`,
//       [pending.hostel, pending.kerberos, pending.category, pending.description, pending.photo_url]
//     );

//     // Clean up used OTP record from database
//     await pool.query(`DELETE FROM pending_otps WHERE kerberos = $1`, [cleanKerberos]);

//     // Send email notification to caretaker
//     const caretakerEmail = getCaretakerEmail(pending.hostel);
//     transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `New Maintenance Request: ${pending.hostel}`,
//       text: `A new complaint has been lodged by ${pending.kerberos}:\n\nCategory: ${pending.category}\nDescription: ${pending.description}`
//     }).catch(err => console.error("Caretaker mail error:", err));

//     return res.json({ success: true, message: 'Complaint created successfully', complaint: result.rows[0] });
//   } catch (err) {
//     console.error("Verification Error:", err.message || err);
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// module.exports = app;



// const express = require('express');
// const { Pool } = require('pg');
// const nodemailer = require('nodemailer');
// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');
// const path = require('path');

// const app = express();

// // --- Express Body Limits ---
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ limit: '10mb', extended: true }));
// app.use(express.static(path.join(__dirname, '../public')));

// // --- PostgreSQL Pool Setup ---
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
//   max: 1,
//   connectionTimeoutMillis: 10000
// });

// pool.on('error', (err) => {
//   console.error('Unexpected error on idle PostgreSQL client:', err.message || err);
// });

// // Helper: Ensure all DB tables exist for persistence
// const initDb = async () => {
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS pending_otps (
//         kerberos VARCHAR(50) PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         hostel VARCHAR(100) NOT NULL,
//         category VARCHAR(100) NOT NULL,
//         description TEXT NOT NULL,
//         photo_url TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS caretaker_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         action_type VARCHAR(50),
//         fix_photo TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS student_action_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         purpose VARCHAR(20) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS issue_photo TEXT;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS fix_photo TEXT;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rejection_count INT DEFAULT 0;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS last_rejection_reason TEXT;
//     `);

//     console.log("Database initialized successfully!");
//   } catch (err) {
//     console.error("Failed to initialize database:", err.message || err);
//   }
// };
// initDb();

// // --- Cloudinary Config ---
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // --- Multer Memory Storage ---
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }
// });

// const uploadToCloudinary = (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'complaints' },
//       (error, result) => {
//         if (result) resolve(result.secure_url);
//         else reject(error);
//       }
//     );
//     stream.end(fileBuffer);
//   });
// };

// // --- Nodemailer Transporter ---
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// // --- Caretaker Email Mapping ---
// function getCaretakerEmail(hostelName) {
//   const map = {
//     'Aravali': 'aashishraj0310@gmail.com',
//   };
//   return map[hostelName] || 'aashishraj0310@gmail.com';
// }

// // ==========================================
// // 📍 API ENDPOINTS
// // ==========================================

// // GET Complaints
// app.get('/api/complaints', async (req, res) => {
//   const { hostel } = req.query;
//   try {
//     let query = `SELECT *, COALESCE(rejection_count, 0) as rejection_count,
//                  EXTRACT(EPOCH FROM (NOW() - resolved_at))/3600 as hours_since_fix
//                  FROM complaints`;
//     let params = [];
//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = $1`;
//       params.push(hostel);
//     }
//     query += ` ORDER BY created_at DESC`;
//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching complaints:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to fetch complaints' });
//   }
// });

// // -----------------------------------------------------------------
// // 1️⃣ STUDENT COMPLAINT SUBMISSION OTP ENDPOINTS
// // -----------------------------------------------------------------
// app.post('/api/complaints/request-submission-otp', upload.any(), async (req, res) => {
//   try {
//     const hostel = req.body.hostel || req.body.hostel_name;
//     const kerberos = req.body.kerberos || req.body.kerberos_id;
//     const category = req.body.category;
//     const description = req.body.description;

//     if (!hostel || !kerberos || !category || !description) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     let photoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) {
//       photoUrl = await uploadToCloudinary(file.buffer);
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const cleanKerberos = kerberos.trim().toLowerCase();
//     const studentEmail = `${cleanKerberos}@iitd.ac.in`;

//     await pool.query(
//       `INSERT INTO pending_otps (kerberos, otp, hostel, category, description, photo_url)
//        VALUES ($1, $2, $3, $4, $5, $6)
//        ON CONFLICT (kerberos) DO UPDATE 
//        SET otp = EXCLUDED.otp, hostel = EXCLUDED.hostel, category = EXCLUDED.category, 
//            description = EXCLUDED.description, photo_url = EXCLUDED.photo_url, created_at = CURRENT_TIMESTAMP`,
//       [cleanKerberos, otp, hostel, category, description, photoUrl]
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: 'OTP for Complaint Submission',
//       text: `Your OTP for submitting the complaint is: ${otp}`
//     });

//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       tempId: cleanKerberos, 
//       emailSentTo: studentEmail,
//       studentEmail: studentEmail,
//       kerberos: cleanKerberos
//     });
//   } catch (err) {
//     console.error("OTP Error Details:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const otp = req.body.userOtp || req.body.otp || req.body.code || req.body.otpCode;
//     const kerberos = req.body.tempId || req.body.kerberos || req.body.kerberos_id || req.body.username;

//     const cleanOtp = otp ? otp.toString().trim() : '';
//     let cleanKerberos = kerberos ? kerberos.toString().trim().toLowerCase() : '';

//     if (!cleanOtp) {
//       return res.status(400).json({ error: 'OTP code is required' });
//     }

//     let pending = null;

//     if (cleanKerberos) {
//       const pendingResult = await pool.query(
//         `SELECT * FROM pending_otps WHERE kerberos = $1`,
//         [cleanKerberos]
//       );
//       if (pendingResult.rows.length > 0) {
//         pending = pendingResult.rows[0];
//       }
//     }

//     if (!pending) {
//       const pendingByOtp = await pool.query(
//         `SELECT * FROM pending_otps WHERE otp = $1 ORDER BY created_at DESC LIMIT 1`,
//         [cleanOtp]
//       );
//       if (pendingByOtp.rows.length > 0) {
//         pending = pendingByOtp.rows[0];
//         cleanKerberos = pending.kerberos;
//       }
//     }

//     if (!pending || pending.otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     const result = await pool.query(
//       `INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo, status)
//        VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING *`,
//       [pending.hostel, pending.kerberos, pending.category, pending.description, pending.photo_url]
//     );

//     await pool.query(`DELETE FROM pending_otps WHERE kerberos = $1`, [cleanKerberos]);

//     const caretakerEmail = getCaretakerEmail(pending.hostel);
//     transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `New Maintenance Request: ${pending.hostel}`,
//       text: `A new complaint has been lodged by ${pending.kerberos}:\n\nCategory: ${pending.category}\nDescription: ${pending.description}`
//     }).catch(err => console.error("Caretaker mail error:", err));

//     return res.json({ success: true, message: 'Complaint created successfully', complaint: result.rows[0] });
//   } catch (err) {
//     console.error("Verification Error:", err.message || err);
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// // -----------------------------------------------------------------
// // 2️⃣ CARETAKER FIX SUBMISSION OTP ENDPOINTS
// // -----------------------------------------------------------------
// app.post('/api/complaints/request-caretaker-otp/:id', upload.any(), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const action_type = req.body.action_type || 'Repaired';

//     let fixPhotoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) {
//       fixPhotoUrl = await uploadToCloudinary(file.buffer);
//     }

//     const complaintRes = await pool.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
//     if (complaintRes.rows.length === 0) {
//       return res.status(404).json({ error: 'Complaint not found' });
//     }
//     const complaint = complaintRes.rows[0];

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const caretakerEmail = getCaretakerEmail(complaint.hostel_name);

//     await pool.query(
//       `INSERT INTO caretaker_otps (complaint_id, otp, action_type, fix_photo)
//        VALUES ($1, $2, $3, $4)
//        ON CONFLICT (complaint_id) DO UPDATE 
//        SET otp = EXCLUDED.otp, action_type = EXCLUDED.action_type, 
//            fix_photo = EXCLUDED.fix_photo, created_at = CURRENT_TIMESTAMP`,
//       [id, otp, action_type, fixPhotoUrl]
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `Verification OTP for Caretaker Action (Issue #${id})`,
//       text: `Your OTP to mark issue #${id} as fixed is: ${otp}`
//     });

//     res.json({
//       success: true,
//       message: 'Caretaker OTP sent successfully',
//       emailSentTo: caretakerEmail
//     });
//   } catch (err) {
//     console.error("Caretaker OTP Request Error:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send Caretaker OTP' });
//   }
// });

// app.post('/api/complaints/verify-caretaker-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userOtp = req.body.userOtp || req.body.otp;

//     const cleanOtp = userOtp ? userOtp.toString().trim() : '';

//     if (!cleanOtp) {
//       return res.status(400).json({ error: 'OTP code is required' });
//     }

//     const otpResult = await pool.query(
//       `SELECT * FROM caretaker_otps WHERE complaint_id = $1`,
//       [id]
//     );

//     if (otpResult.rows.length === 0 || otpResult.rows[0].otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     const caretakerData = otpResult.rows[0];

//     const updated = await pool.query(
//       `UPDATE complaints 
//        SET status = 'Awaiting Student Verification', 
//            fix_photo = $1, 
//            resolved_at = CURRENT_TIMESTAMP
//        WHERE id = $2 RETURNING *`,
//       [caretakerData.fix_photo, id]
//     );

//     await pool.query(`DELETE FROM caretaker_otps WHERE complaint_id = $1`, [id]);

//     return res.json({
//       success: true,
//       message: 'Caretaker fix verified and updated successfully',
//       complaint: updated.rows[0]
//     });
//   } catch (err) {
//     console.error("Caretaker Verification Error:", err.message || err);
//     return res.status(500).json({ error: err.message || 'Failed to verify Caretaker OTP' });
//   }
// });

// // -----------------------------------------------------------------
// // 3️⃣ STUDENT FIX VERIFICATION / REJECTION OTP ENDPOINTS
// // -----------------------------------------------------------------
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { purpose } = req.body; // 'verify' or 'reject'

//     const complaintRes = await pool.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
//     if (complaintRes.rows.length === 0) {
//       return res.status(404).json({ error: 'Complaint not found' });
//     }
//     const complaint = complaintRes.rows[0];

//     const studentEmail = `${complaint.kerberos_id.trim().toLowerCase()}@iitd.ac.in`;
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     await pool.query(
//       `INSERT INTO student_action_otps (complaint_id, otp, purpose)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (complaint_id) DO UPDATE 
//        SET otp = EXCLUDED.otp, purpose = EXCLUDED.purpose, created_at = CURRENT_TIMESTAMP`,
//       [id, otp, purpose || 'verify']
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: `OTP to ${purpose === 'reject' ? 'Reject' : 'Confirm'} Fix for Issue #${id}`,
//       text: `Your OTP is: ${otp}`
//     });

//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       emailSentTo: studentEmail
//     });
//   } catch (err) {
//     console.error("Student Send OTP Error:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// app.post('/api/complaints/verify-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp, approved, rejection_reason } = req.body;

//     const cleanOtp = userOtp ? userOtp.toString().trim() : '';

//     if (!cleanOtp) {
//       return res.status(400).json({ error: 'OTP is required' });
//     }

//     const otpResult = await pool.query(
//       `SELECT * FROM student_action_otps WHERE complaint_id = $1`,
//       [id]
//     );

//     if (otpResult.rows.length === 0 || otpResult.rows[0].otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     let updatedComplaint;

//     if (approved) {
//       // Mark as fully resolved
//       const resQuery = await pool.query(
//         `UPDATE complaints 
//          SET status = 'Resolved' 
//          WHERE id = $1 RETURNING *`,
//         [id]
//       );
//       updatedComplaint = resQuery.rows[0];
//     } else {
//       // Reject fix and reopen complaint for caretaker
//       const resQuery = await pool.query(
//         `UPDATE complaints 
//          SET status = 'Pending', 
//              rejection_count = COALESCE(rejection_count, 0) + 1,
//              last_rejection_reason = $1 
//          WHERE id = $2 RETURNING *`,
//         [rejection_reason || 'Fix rejected by student.', id]
//       );
//       updatedComplaint = resQuery.rows[0];
//     }

//     await pool.query(`DELETE FROM student_action_otps WHERE complaint_id = $1`, [id]);

//     return res.json({
//       success: true,
//       message: approved ? 'Fix verified successfully!' : 'Fix rejected. Reopened for caretaker.',
//       complaint: updatedComplaint
//     });
//   } catch (err) {
//     console.error("Student Verify OTP Error:", err.message || err);
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// module.exports = app;



// const express = require('express');
// const { Pool } = require('pg');
// const nodemailer = require('nodemailer');
// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');
// const path = require('path');

// const app = express();

// // --- Express Body Limits ---
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ limit: '10mb', extended: true }));
// app.use(express.static(path.join(__dirname, '../public')));

// // --- PostgreSQL Pool Setup ---
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
//   max: 1,
//   connectionTimeoutMillis: 10000
// });

// pool.on('error', (err) => {
//   console.error('Unexpected error on idle PostgreSQL client:', err.message || err);
// });

// // Helper: Ensure DB tables exist
// const initDb = async () => {
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS pending_otps (
//         kerberos VARCHAR(50) PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         hostel VARCHAR(100) NOT NULL,
//         category VARCHAR(100) NOT NULL,
//         description TEXT NOT NULL,
//         photo_url TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS caretaker_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         action_type VARCHAR(50),
//         fix_photo TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS student_action_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         purpose VARCHAR(20) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS issue_photo TEXT;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS fix_photo TEXT;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rejection_count INT DEFAULT 0;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS last_rejection_reason TEXT;
//     `);

//     console.log("Database initialized successfully!");
//   } catch (err) {
//     console.error("Failed to initialize database:", err.message || err);
//   }
// };
// initDb();

// // --- Cloudinary Config ---
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // --- Multer Memory Storage ---
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }
// });

// const uploadToCloudinary = (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'complaints' },
//       (error, result) => {
//         if (result) resolve(result.secure_url);
//         else reject(error);
//       }
//     );
//     stream.end(fileBuffer);
//   });
// };

// // --- Nodemailer Transporter ---
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// // --- Caretaker Email Mapping ---
// function getCaretakerEmail(hostelName) {
//   const map = {
//     'Aravali': 'aashishraj0310@gmail.com',
//   };
//   return map[hostelName] || 'aashishraj0310@gmail.com';
// }

// // ==========================================
// // 📍 API ENDPOINTS
// // ==========================================

// // GET Complaints
// app.get('/api/complaints', async (req, res) => {
//   const { hostel } = req.query;
//   try {
//     let query = `SELECT *, COALESCE(rejection_count, 0) as rejection_count,
//                  EXTRACT(EPOCH FROM (NOW() - resolved_at))/3600 as hours_since_fix
//                  FROM complaints`;
//     let params = [];
//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = $1`;
//       params.push(hostel);
//     }
//     query += ` ORDER BY created_at DESC`;
//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching complaints:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to fetch complaints' });
//   }
// });

// // -----------------------------------------------------------------
// // 1️⃣ STUDENT COMPLAINT SUBMISSION OTP ENDPOINTS
// // -----------------------------------------------------------------
// app.post('/api/complaints/request-submission-otp', upload.any(), async (req, res) => {
//   try {
//     const hostel = req.body.hostel_name || req.body.hostel;
//     const kerberos = req.body.kerberos_id || req.body.kerberos;
//     const category = req.body.category;
//     const description = req.body.description;

//     if (!hostel || !kerberos || !category || !description) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     let photoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) {
//       photoUrl = await uploadToCloudinary(file.buffer);
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const cleanKerberos = kerberos.trim().toLowerCase();
//     const studentEmail = `${cleanKerberos}@iitd.ac.in`;

//     await pool.query(
//       `INSERT INTO pending_otps (kerberos, otp, hostel, category, description, photo_url)
//        VALUES ($1, $2, $3, $4, $5, $6)
//        ON CONFLICT (kerberos) DO UPDATE 
//        SET otp = EXCLUDED.otp, hostel = EXCLUDED.hostel, category = EXCLUDED.category, 
//            description = EXCLUDED.description, photo_url = EXCLUDED.photo_url, created_at = CURRENT_TIMESTAMP`,
//       [cleanKerberos, otp, hostel, category, description, photoUrl]
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: 'OTP for Complaint Submission',
//       text: `Your OTP for submitting the complaint is: ${otp}`
//     });

//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       tempId: cleanKerberos, 
//       emailSentTo: studentEmail,
//       studentEmail: studentEmail,
//       kerberos: cleanKerberos
//     });
//   } catch (err) {
//     console.error("OTP Error Details:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const otp = req.body.userOtp || req.body.otp;
//     const kerberos = req.body.tempId || req.body.kerberos;

//     const cleanOtp = otp ? otp.toString().trim() : '';
//     let cleanKerberos = kerberos ? kerberos.toString().trim().toLowerCase() : '';

//     if (!cleanOtp) {
//       return res.status(400).json({ error: 'OTP code is required' });
//     }

//     let pending = null;

//     if (cleanKerberos) {
//       const pendingResult = await pool.query(
//         `SELECT * FROM pending_otps WHERE kerberos = $1`,
//         [cleanKerberos]
//       );
//       if (pendingResult.rows.length > 0) {
//         pending = pendingResult.rows[0];
//       }
//     }

//     if (!pending) {
//       const pendingByOtp = await pool.query(
//         `SELECT * FROM pending_otps WHERE otp = $1 ORDER BY created_at DESC LIMIT 1`,
//         [cleanOtp]
//       );
//       if (pendingByOtp.rows.length > 0) {
//         pending = pendingByOtp.rows[0];
//         cleanKerberos = pending.kerberos;
//       }
//     }

//     if (!pending || pending.otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     const result = await pool.query(
//       `INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo, status)
//        VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING *`,
//       [pending.hostel, pending.kerberos, pending.category, pending.description, pending.photo_url]
//     );

//     await pool.query(`DELETE FROM pending_otps WHERE kerberos = $1`, [cleanKerberos]);

//     const caretakerEmail = getCaretakerEmail(pending.hostel);
//     transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `New Maintenance Request: ${pending.hostel}`,
//       text: `A new complaint has been lodged by ${pending.kerberos}:\n\nCategory: ${pending.category}\nDescription: ${pending.description}`
//     }).catch(err => console.error("Caretaker mail error:", err));

//     return res.json({ success: true, message: 'Complaint created successfully', complaint: result.rows[0] });
//   } catch (err) {
//     console.error("Verification Error:", err.message || err);
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// // -----------------------------------------------------------------
// // 2️⃣ CARETAKER FIX SUBMISSION OTP ENDPOINTS
// // -----------------------------------------------------------------
// app.post('/api/complaints/request-caretaker-otp/:id', upload.any(), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const action_type = req.body.action_type || 'Repaired';

//     let fixPhotoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) {
//       fixPhotoUrl = await uploadToCloudinary(file.buffer);
//     }

//     const complaintRes = await pool.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
//     if (complaintRes.rows.length === 0) {
//       return res.status(404).json({ error: 'Complaint not found' });
//     }
//     const complaint = complaintRes.rows[0];

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const caretakerEmail = getCaretakerEmail(complaint.hostel_name);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS caretaker_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         action_type VARCHAR(50),
//         fix_photo TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(
//       `INSERT INTO caretaker_otps (complaint_id, otp, action_type, fix_photo)
//        VALUES ($1, $2, $3, $4)
//        ON CONFLICT (complaint_id) DO UPDATE 
//        SET otp = EXCLUDED.otp, action_type = EXCLUDED.action_type, 
//            fix_photo = EXCLUDED.fix_photo, created_at = CURRENT_TIMESTAMP`,
//       [id, otp, action_type, fixPhotoUrl]
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `Verification OTP for Caretaker Action (Issue #${id})`,
//       text: `Your OTP to mark issue #${id} as fixed is: ${otp}`
//     });

//     res.json({
//       success: true,
//       message: 'Caretaker OTP sent successfully',
//       emailSentTo: caretakerEmail
//     });
//   } catch (err) {
//     console.error("Caretaker OTP Request Error:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send Caretaker OTP' });
//   }
// });

// app.post('/api/complaints/verify-caretaker-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userOtp = req.body.userOtp || req.body.otp;

//     const cleanOtp = userOtp ? userOtp.toString().trim() : '';

//     if (!cleanOtp) {
//       return res.status(400).json({ error: 'OTP code is required' });
//     }

//     const otpResult = await pool.query(
//       `SELECT * FROM caretaker_otps WHERE complaint_id = $1`,
//       [id]
//     );

//     if (otpResult.rows.length === 0 || otpResult.rows[0].otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     const caretakerData = otpResult.rows[0];

//     const updated = await pool.query(
//       `UPDATE complaints 
//        SET status = 'Awaiting Student Verification', 
//            fix_photo = $1, 
//            resolved_at = CURRENT_TIMESTAMP
//        WHERE id = $2 RETURNING *`,
//       [caretakerData.fix_photo, id]
//     );

//     await pool.query(`DELETE FROM caretaker_otps WHERE complaint_id = $1`, [id]);

//     return res.json({
//       success: true,
//       message: 'Caretaker fix verified and updated successfully',
//       complaint: updated.rows[0]
//     });
//   } catch (err) {
//     console.error("Caretaker Verification Error:", err.message || err);
//     return res.status(500).json({ error: err.message || 'Failed to verify Caretaker OTP' });
//   }
// });

// // -----------------------------------------------------------------
// // 3️⃣ STUDENT FIX VERIFICATION / REJECTION OTP ENDPOINTS
// // -----------------------------------------------------------------
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { purpose } = req.body;

//     // Direct Table Guard
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS student_action_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         purpose VARCHAR(20) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     const complaintRes = await pool.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
//     if (complaintRes.rows.length === 0) {
//       return res.status(404).json({ error: 'Complaint not found' });
//     }
//     const complaint = complaintRes.rows[0];

//     const studentEmail = `${complaint.kerberos_id.trim().toLowerCase()}@iitd.ac.in`;
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     await pool.query(
//       `INSERT INTO student_action_otps (complaint_id, otp, purpose)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (complaint_id) DO UPDATE 
//        SET otp = EXCLUDED.otp, purpose = EXCLUDED.purpose, created_at = CURRENT_TIMESTAMP`,
//       [id, otp, purpose || 'verify']
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: `OTP to ${purpose === 'reject' ? 'Reject' : 'Confirm'} Fix for Issue #${id}`,
//       text: `Your OTP is: ${otp}`
//     });

//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       emailSentTo: studentEmail
//     });
//   } catch (err) {
//     console.error("Student Send OTP Error:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// app.post('/api/complaints/verify-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userOtp = req.body.userOtp || req.body.otp;
//     const isApproved = req.body.approved === true || req.body.approved === 'true';
//     const rejectionReason = req.body.rejection_reason || req.body.rejectionReason;

//     const cleanOtp = userOtp ? userOtp.toString().trim() : '';

//     if (!cleanOtp) {
//       return res.status(400).json({ error: 'OTP is required' });
//     }

//     const otpResult = await pool.query(
//       `SELECT * FROM student_action_otps WHERE complaint_id = $1`,
//       [id]
//     );

//     if (otpResult.rows.length === 0 || otpResult.rows[0].otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     let updatedComplaint;

//     if (isApproved) {
//       const resQuery = await pool.query(
//         `UPDATE complaints 
//          SET status = 'Resolved' 
//          WHERE id = $1 RETURNING *`,
//         [id]
//       );
//       updatedComplaint = resQuery.rows[0];
//     } else {
//       // Ensure rejection columns exist
//       await pool.query(`
//         ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rejection_count INT DEFAULT 0;
//         ALTER TABLE complaints ADD COLUMN IF NOT EXISTS last_rejection_reason TEXT;
//       `);

//       const resQuery = await pool.query(
//         `UPDATE complaints 
//          SET status = 'Pending', 
//              rejection_count = COALESCE(rejection_count, 0) + 1,
//              last_rejection_reason = $1 
//          WHERE id = $2 RETURNING *`,
//         [rejectionReason || 'Fix rejected by student.', id]
//       );
//       updatedComplaint = resQuery.rows[0];
//     }

//     await pool.query(`DELETE FROM student_action_otps WHERE complaint_id = $1`, [id]);

//     return res.json({
//       success: true,
//       message: isApproved ? 'Fix verified successfully!' : 'Fix rejected. Reopened for caretaker.',
//       complaint: updatedComplaint
//     });
//   } catch (err) {
//     console.error("Student Verify OTP Error:", err.message || err);
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// module.exports = app;



// const express = require('express');
// const { Pool } = require('pg');
// const nodemailer = require('nodemailer');
// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');
// const path = require('path');

// const app = express();

// // --- Express Body Limits ---
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ limit: '10mb', extended: true }));
// app.use(express.static(path.join(__dirname, '../public')));

// // --- PostgreSQL Pool Setup (Serverless Friendly) ---
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
//   max: 1,
//   connectionTimeoutMillis: 10000
// });

// pool.on('error', (err) => {
//   console.error('Unexpected error on idle PostgreSQL client:', err.message || err);
// });

// // Helper: Ensure all DB tables exist for persistence
// const initDb = async () => {
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS pending_otps (
//         kerberos VARCHAR(50) PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         hostel VARCHAR(100) NOT NULL,
//         category VARCHAR(100) NOT NULL,
//         description TEXT NOT NULL,
//         photo_url TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS caretaker_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         action_type VARCHAR(50),
//         fix_photo TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS student_action_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         purpose VARCHAR(20) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(`
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS issue_photo TEXT;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS fix_photo TEXT;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rejection_count INT DEFAULT 0;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS last_rejection_reason TEXT;
//     `);

//     console.log("Database initialized successfully!");
//   } catch (err) {
//     console.error("Failed to initialize database:", err.message || err);
//   }
// };
// initDb();

// // --- Cloudinary Config ---
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // --- Multer Memory Storage ---
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }
// });

// const uploadToCloudinary = (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'complaints' },
//       (error, result) => {
//         if (result) resolve(result.secure_url);
//         else reject(error);
//       }
//     );
//     stream.end(fileBuffer);
//   });
// };

// // --- Nodemailer Transporter ---
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// // --- Caretaker Email Mapping ---
// function getCaretakerEmail(hostelName) {
//   const map = {
//     'Aravali': 'aashishraj0310@gmail.com',
//   };
//   return map[hostelName] || 'aashishraj0310@gmail.com';
// }

// // ==========================================
// // 📍 API ENDPOINTS
// // ==========================================

// // GET Complaints
// app.get('/api/complaints', async (req, res) => {
//   const { hostel } = req.query;
//   try {
//     let query = `SELECT *, COALESCE(rejection_count, 0) as rejection_count,
//                  EXTRACT(EPOCH FROM (NOW() - resolved_at))/3600 as hours_since_fix
//                  FROM complaints`;
//     let params = [];
//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = $1`;
//       params.push(hostel);
//     }
//     query += ` ORDER BY created_at DESC`;
//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching complaints:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to fetch complaints' });
//   }
// });

// // -----------------------------------------------------------------
// // 1️⃣ STUDENT COMPLAINT SUBMISSION OTP ENDPOINTS
// // -----------------------------------------------------------------
// app.post('/api/complaints/request-submission-otp', upload.any(), async (req, res) => {
//   try {
//     const hostel = req.body.hostel_name || req.body.hostel;
//     const kerberos = req.body.kerberos_id || req.body.kerberos;
//     const category = req.body.category;
//     const description = req.body.description;

//     if (!hostel || !kerberos || !category || !description) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     let photoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) {
//       photoUrl = await uploadToCloudinary(file.buffer);
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const cleanKerberos = kerberos.trim().toLowerCase();
//     const studentEmail = `${cleanKerberos}@iitd.ac.in`;

//     await pool.query(
//       `INSERT INTO pending_otps (kerberos, otp, hostel, category, description, photo_url)
//        VALUES ($1, $2, $3, $4, $5, $6)
//        ON CONFLICT (kerberos) DO UPDATE 
//        SET otp = EXCLUDED.otp, hostel = EXCLUDED.hostel, category = EXCLUDED.category, 
//            description = EXCLUDED.description, photo_url = EXCLUDED.photo_url, created_at = CURRENT_TIMESTAMP`,
//       [cleanKerberos, otp, hostel, category, description, photoUrl]
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: 'OTP for Complaint Submission',
//       text: `Your OTP for submitting the complaint is: ${otp}`
//     });

//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       tempId: cleanKerberos, 
//       emailSentTo: studentEmail,
//       studentEmail: studentEmail,
//       kerberos: cleanKerberos
//     });
//   } catch (err) {
//     console.error("OTP Error Details:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const otp = req.body.userOtp || req.body.otp;
//     const kerberos = req.body.tempId || req.body.kerberos;

//     const cleanOtp = otp ? otp.toString().trim() : '';
//     let cleanKerberos = kerberos ? kerberos.toString().trim().toLowerCase() : '';

//     if (!cleanOtp) {
//       return res.status(400).json({ error: 'OTP code is required' });
//     }

//     let pending = null;

//     if (cleanKerberos) {
//       const pendingResult = await pool.query(
//         `SELECT * FROM pending_otps WHERE kerberos = $1`,
//         [cleanKerberos]
//       );
//       if (pendingResult.rows.length > 0) {
//         pending = pendingResult.rows[0];
//       }
//     }

//     if (!pending) {
//       const pendingByOtp = await pool.query(
//         `SELECT * FROM pending_otps WHERE otp = $1 ORDER BY created_at DESC LIMIT 1`,
//         [cleanOtp]
//       );
//       if (pendingByOtp.rows.length > 0) {
//         pending = pendingByOtp.rows[0];
//         cleanKerberos = pending.kerberos;
//       }
//     }

//     if (!pending || pending.otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     const result = await pool.query(
//       `INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo, status)
//        VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING *`,
//       [pending.hostel, pending.kerberos, pending.category, pending.description, pending.photo_url]
//     );

//     await pool.query(`DELETE FROM pending_otps WHERE kerberos = $1`, [cleanKerberos]);

//     const caretakerEmail = getCaretakerEmail(pending.hostel);
//     transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `New Maintenance Request: ${pending.hostel}`,
//       text: `A new complaint has been lodged by ${pending.kerberos}:\n\nCategory: ${pending.category}\nDescription: ${pending.description}`
//     }).catch(err => console.error("Caretaker mail error:", err));

//     return res.json({ success: true, message: 'Complaint created successfully', complaint: result.rows[0] });
//   } catch (err) {
//     console.error("Verification Error:", err.message || err);
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// // -----------------------------------------------------------------
// // 2️⃣ CARETAKER FIX SUBMISSION OTP ENDPOINTS
// // -----------------------------------------------------------------
// app.post('/api/complaints/request-caretaker-otp/:id', upload.any(), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const action_type = req.body.action_type || 'Repaired';

//     let fixPhotoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) {
//       fixPhotoUrl = await uploadToCloudinary(file.buffer);
//     }

//     const complaintRes = await pool.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
//     if (complaintRes.rows.length === 0) {
//       return res.status(404).json({ error: 'Complaint not found' });
//     }
//     const complaint = complaintRes.rows[0];

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const caretakerEmail = getCaretakerEmail(complaint.hostel_name);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS caretaker_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         action_type VARCHAR(50),
//         fix_photo TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     await pool.query(
//       `INSERT INTO caretaker_otps (complaint_id, otp, action_type, fix_photo)
//        VALUES ($1, $2, $3, $4)
//        ON CONFLICT (complaint_id) DO UPDATE 
//        SET otp = EXCLUDED.otp, action_type = EXCLUDED.action_type, 
//            fix_photo = EXCLUDED.fix_photo, created_at = CURRENT_TIMESTAMP`,
//       [id, otp, action_type, fixPhotoUrl]
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `Verification OTP for Caretaker Action (Issue #${id})`,
//       text: `Your OTP to mark issue #${id} as fixed is: ${otp}`
//     });

//     res.json({
//       success: true,
//       message: 'Caretaker OTP sent successfully',
//       emailSentTo: caretakerEmail
//     });
//   } catch (err) {
//     console.error("Caretaker OTP Request Error:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send Caretaker OTP' });
//   }
// });

// app.post('/api/complaints/verify-caretaker-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userOtp = req.body.userOtp || req.body.otp;

//     const cleanOtp = userOtp ? userOtp.toString().trim() : '';

//     if (!cleanOtp) {
//       return res.status(400).json({ error: 'OTP code is required' });
//     }

//     const otpResult = await pool.query(
//       `SELECT * FROM caretaker_otps WHERE complaint_id = $1`,
//       [id]
//     );

//     if (otpResult.rows.length === 0 || otpResult.rows[0].otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     const caretakerData = otpResult.rows[0];

//     const updated = await pool.query(
//       `UPDATE complaints 
//        SET status = 'Awaiting Student Verification', 
//            fix_photo = $1, 
//            resolved_at = CURRENT_TIMESTAMP
//        WHERE id = $2 RETURNING *`,
//       [caretakerData.fix_photo, id]
//     );

//     await pool.query(`DELETE FROM caretaker_otps WHERE complaint_id = $1`, [id]);

//     const complaint = updated.rows[0];
//     const studentEmail = `${complaint.kerberos_id.trim().toLowerCase()}@iitd.ac.in`;

//     // 📩 NOTIFY STUDENT THAT FIX IS COMPLETED
//     transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: `Maintenance Request #${id} Resolved - Verification Needed`,
//       text: `Hello,\n\nThe caretaker has marked your maintenance complaint (Category: ${complaint.category}) as fixed.\n\nPlease log in to the portal to view the proof photo and verify or reject the fix.`
//     }).catch(err => console.error("Student notification mail error:", err));

//     return res.json({
//       success: true,
//       message: 'Caretaker fix verified and updated successfully',
//       complaint: complaint
//     });
//   } catch (err) {
//     console.error("Caretaker Verification Error:", err.message || err);
//     return res.status(500).json({ error: err.message || 'Failed to verify Caretaker OTP' });
//   }
// });

// // -----------------------------------------------------------------
// // 3️⃣ STUDENT FIX VERIFICATION / REJECTION OTP ENDPOINTS
// // -----------------------------------------------------------------
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { purpose } = req.body;

//     // Table Guard
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS student_action_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         purpose VARCHAR(20) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     const complaintRes = await pool.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
//     if (complaintRes.rows.length === 0) {
//       return res.status(404).json({ error: 'Complaint not found' });
//     }
//     const complaint = complaintRes.rows[0];

//     const studentEmail = `${complaint.kerberos_id.trim().toLowerCase()}@iitd.ac.in`;
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     await pool.query(
//       `INSERT INTO student_action_otps (complaint_id, otp, purpose)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (complaint_id) DO UPDATE 
//        SET otp = EXCLUDED.otp, purpose = EXCLUDED.purpose, created_at = CURRENT_TIMESTAMP`,
//       [id, otp, purpose || 'verify']
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: `OTP to ${purpose === 'reject' ? 'Reject' : 'Confirm'} Fix for Issue #${id}`,
//       text: `Your OTP is: ${otp}`
//     });

//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       emailSentTo: studentEmail
//     });
//   } catch (err) {
//     console.error("Student Send OTP Error:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// app.post('/api/complaints/verify-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userOtp = req.body.userOtp || req.body.otp;
//     const isApproved = req.body.approved === true || req.body.approved === 'true';
//     const rejectionReason = req.body.rejection_reason || req.body.rejectionReason;

//     const cleanOtp = userOtp ? userOtp.toString().trim() : '';

//     if (!cleanOtp) {
//       return res.status(400).json({ error: 'OTP is required' });
//     }

//     const otpResult = await pool.query(
//       `SELECT * FROM student_action_otps WHERE complaint_id = $1`,
//       [id]
//     );

//     if (otpResult.rows.length === 0 || otpResult.rows[0].otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     let updatedComplaint;

//     if (isApproved) {
//       const resQuery = await pool.query(
//         `UPDATE complaints 
//          SET status = 'Resolved' 
//          WHERE id = $1 RETURNING *`,
//         [id]
//       );
//       updatedComplaint = resQuery.rows[0];
//     } else {
//       await pool.query(`
//         ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rejection_count INT DEFAULT 0;
//         ALTER TABLE complaints ADD COLUMN IF NOT EXISTS last_rejection_reason TEXT;
//       `);

//       const resQuery = await pool.query(
//         `UPDATE complaints 
//          SET status = 'Pending', 
//              rejection_count = COALESCE(rejection_count, 0) + 1,
//              last_rejection_reason = $1 
//          WHERE id = $2 RETURNING *`,
//         [rejectionReason || 'Fix rejected by student.', id]
//       );
//       updatedComplaint = resQuery.rows[0];

//       // 📩 NOTIFY CARETAKER OF REJECTION
//       const caretakerEmail = getCaretakerEmail(updatedComplaint.hostel_name);
//       transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: caretakerEmail,
//         subject: `⚠️ Fix Rejected for Issue #${id} (${updatedComplaint.hostel_name})`,
//         text: `The student (${updatedComplaint.kerberos_id}) rejected the fix for Issue #${id}.\n\nReason: ${rejectionReason || 'No specific reason given.'}\n\nThe complaint has been reopened as 'Pending'. Please inspect and re-submit.`
//       }).catch(err => console.error("Caretaker rejection notification error:", err));
//     }

//     await pool.query(`DELETE FROM student_action_otps WHERE complaint_id = $1`, [id]);

//     return res.json({
//       success: true,
//       message: isApproved ? 'Fix verified successfully!' : 'Fix rejected. Reopened for caretaker.',
//       complaint: updatedComplaint
//     });
//   } catch (err) {
//     console.error("Student Verify OTP Error:", err.message || err);
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// module.exports = app;



// const express = require('express');
// const { Pool } = require('pg');
// const nodemailer = require('nodemailer');
// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');

// const app = express();

// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ limit: '10mb', extended: true }));

// // SSL & Connection Pool
// const dbUrl = (process.env.DATABASE_URL || '').split('?')[0];
// const pool = new Pool({
//   connectionString: dbUrl || process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
//   max: 1,
//   connectionTimeoutMillis: 10000
// });

// pool.on('error', (err) => console.error('PG Pool error:', err.message || err));

// // Database Table Auto-Setup Middleware
// let dbInitialized = false;
// const ensureDb = async () => {
//   if (dbInitialized) return;
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS pending_otps (
//         kerberos VARCHAR(50) PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         hostel VARCHAR(100) NOT NULL,
//         category VARCHAR(100) NOT NULL,
//         description TEXT NOT NULL,
//         photo_url TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//       CREATE TABLE IF NOT EXISTS caretaker_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         action_type VARCHAR(50),
//         fix_photo TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//       CREATE TABLE IF NOT EXISTS student_action_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         purpose VARCHAR(20) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS issue_photo TEXT;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS fix_photo TEXT;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rejection_count INT DEFAULT 0;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS last_rejection_reason TEXT;
//     `);
//     dbInitialized = true;
//   } catch (err) {
//     console.error("DB setup notice:", err.message || err);
//   }
// };

// app.use(async (req, res, next) => {
//   await ensureDb();
//   next();
// });

// // Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// const storage = multer.memoryStorage();
// const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// const uploadToCloudinary = (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'complaints' },
//       (error, result) => { if (result) resolve(result.secure_url); else reject(error); }
//     );
//     stream.end(fileBuffer);
//   });
// };

// // Nodemailer
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// function getCaretakerEmail(hostelName) {
//   const map = { 'Aravali': 'aashishraj0310@gmail.com' };
//   return map[hostelName] || 'aashishraj0310@gmail.com';
// }

// // ==========================================
// // 📍 API ENDPOINTS
// // ==========================================

// // GET Complaints
// app.get('/api/complaints', async (req, res) => {
//   const { hostel } = req.query;
//   try {
//     let query = `SELECT *, COALESCE(rejection_count, 0) as rejection_count,
//                  EXTRACT(EPOCH FROM (NOW() - resolved_at))/3600 as hours_since_fix
//                  FROM complaints`;
//     let params = [];
//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = $1`;
//       params.push(hostel);
//     }
//     query += ` ORDER BY created_at DESC`;
//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message || 'Failed to fetch complaints' });
//   }
// });

// // -----------------------------------------------------------------
// // 1️⃣ STUDENT COMPLAINT SUBMISSION FLOW
// // -----------------------------------------------------------------

// // Step 1: Request OTP -> Sends ONLY OTP code to Student
// app.post('/api/complaints/request-submission-otp', upload.any(), async (req, res) => {
//   try {
//     const hostel = req.body.hostel_name || req.body.hostel;
//     const kerberos = req.body.kerberos_id || req.body.kerberos;
//     const category = req.body.category;
//     const description = req.body.description;

//     if (!hostel || !kerberos || !category || !description) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     let photoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) {
//       photoUrl = await uploadToCloudinary(file.buffer);
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const cleanKerberos = kerberos.trim().toLowerCase();
//     const studentEmail = `${cleanKerberos}@iitd.ac.in`;

//     await pool.query(
//       `INSERT INTO pending_otps (kerberos, otp, hostel, category, description, photo_url)
//        VALUES ($1, $2, $3, $4, $5, $6)
//        ON CONFLICT (kerberos) DO UPDATE 
//        SET otp = EXCLUDED.otp, hostel = EXCLUDED.hostel, category = EXCLUDED.category, 
//            description = EXCLUDED.description, photo_url = EXCLUDED.photo_url, created_at = CURRENT_TIMESTAMP`,
//       [cleanKerberos, otp, hostel, category, description, photoUrl]
//     );

//     // 📧 ONLY SEND OTP TO STUDENT
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: 'OTP for Complaint Submission',
//       text: `Your OTP for submitting the complaint is: ${otp}`
//     });

//     res.json({ success: true, tempId: cleanKerberos, emailSentTo: studentEmail });
//   } catch (err) {
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// // Step 2: Verify OTP -> Posts Complaint & Sends Notification to Caretaker
// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const otp = req.body.userOtp || req.body.otp;
//     const kerberos = req.body.tempId || req.body.kerberos || req.body.kerberos_id;

//     const cleanOtp = otp ? otp.toString().trim() : '';
//     let cleanKerberos = kerberos ? kerberos.toString().trim().toLowerCase() : '';

//     if (!cleanOtp) return res.status(400).json({ error: 'OTP code is required' });

//     const pendingResult = await pool.query(`SELECT * FROM pending_otps WHERE kerberos = $1`, [cleanKerberos]);
//     let pending = pendingResult.rows[0];

//     if (!pending) {
//       const pendingByOtp = await pool.query(`SELECT * FROM pending_otps WHERE otp = $1 ORDER BY created_at DESC LIMIT 1`, [cleanOtp]);
//       if (pendingByOtp.rows.length > 0) pending = pendingByOtp.rows[0];
//     }

//     if (!pending || pending.otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     const result = await pool.query(
//       `INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo, status)
//        VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING *`,
//       [pending.hostel, pending.kerberos, pending.category, pending.description, pending.photo_url]
//     );

//     await pool.query(`DELETE FROM pending_otps WHERE kerberos = $1`, [pending.kerberos]);

//     // 📧 SEND NOTIFICATION TO CARETAKER ONLY AFTER VERIFICATION
//     const caretakerEmail = getCaretakerEmail(pending.hostel);
//     transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `🚨 New Maintenance Request: ${pending.hostel}`,
//       text: `A new complaint has been lodged by student ${pending.kerberos}:\n\nCategory: ${pending.category}\nDescription: ${pending.description}`
//     }).catch(err => console.error("Mail error:", err));

//     return res.json({ success: true, complaint: result.rows[0] });
//   } catch (err) {
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// // -----------------------------------------------------------------
// // 2️⃣ CARETAKER FIX SUBMISSION FLOW
// // -----------------------------------------------------------------

// // Step 1: Request Caretaker OTP -> Sends ONLY OTP code to Caretaker
// app.post('/api/complaints/request-caretaker-otp/:id', upload.any(), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const action_type = req.body.action_type || 'Repaired';

//     let fixPhotoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) fixPhotoUrl = await uploadToCloudinary(file.buffer);

//     const complaintRes = await pool.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
//     if (complaintRes.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });
//     const complaint = complaintRes.rows[0];

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const caretakerEmail = getCaretakerEmail(complaint.hostel_name);

//     await pool.query(
//       `INSERT INTO caretaker_otps (complaint_id, otp, action_type, fix_photo)
//        VALUES ($1, $2, $3, $4)
//        ON CONFLICT (complaint_id) DO UPDATE 
//        SET otp = EXCLUDED.otp, action_type = EXCLUDED.action_type, fix_photo = EXCLUDED.fix_photo, created_at = CURRENT_TIMESTAMP`,
//       [id, otp, action_type, fixPhotoUrl]
//     );

//     // 📧 ONLY SEND OTP TO CARETAKER
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `Verification OTP for Caretaker Action (Issue #${id})`,
//       text: `Your OTP to mark issue #${id} as fixed is: ${otp}`
//     });

//     res.json({ success: true, emailSentTo: caretakerEmail });
//   } catch (err) {
//     res.status(500).json({ error: err.message || 'Failed to send Caretaker OTP' });
//   }
// });

// // Step 2: Verify Caretaker OTP -> Updates DB & Sends Notification to Student
// app.post('/api/complaints/verify-caretaker-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userOtp = req.body.userOtp || req.body.otp;
//     const cleanOtp = userOtp ? userOtp.toString().trim() : '';

//     if (!cleanOtp) return res.status(400).json({ error: 'OTP code is required' });

//     const otpResult = await pool.query(`SELECT * FROM caretaker_otps WHERE complaint_id = $1`, [id]);
//     if (otpResult.rows.length === 0 || otpResult.rows[0].otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     const caretakerData = otpResult.rows[0];

//     const updated = await pool.query(
//       `UPDATE complaints 
//        SET status = 'Awaiting Student Verification', fix_photo = $1, resolved_at = CURRENT_TIMESTAMP
//        WHERE id = $2 RETURNING *`,
//       [caretakerData.fix_photo, id]
//     );

//     await pool.query(`DELETE FROM caretaker_otps WHERE complaint_id = $1`, [id]);

//     const complaint = updated.rows[0];
//     const studentEmail = `${complaint.kerberos_id.trim().toLowerCase()}@iitd.ac.in`;

//     // 📧 SEND NOTIFICATION TO STUDENT ONLY AFTER VERIFICATION
//     transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: `🛠️ Maintenance Request #${id} Resolved - Verification Needed`,
//       text: `Hello,\n\nThe caretaker has marked your maintenance complaint (Category: ${complaint.category}) as fixed.\n\nPlease log in to the portal to view the proof photo and confirm or reject the fix.`
//     }).catch(err => console.error("Mail error:", err));

//     return res.json({ success: true, complaint: complaint });
//   } catch (err) {
//     return res.status(500).json({ error: err.message || 'Failed to verify Caretaker OTP' });
//   }
// });

// // -----------------------------------------------------------------
// // 3️⃣ STUDENT FIX VERIFICATION / REJECTION FLOW
// // -----------------------------------------------------------------

// // Step 1: Request Student Action OTP -> Sends ONLY OTP code to Student
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { purpose } = req.body;

//     const complaintRes = await pool.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
//     if (complaintRes.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });
//     const complaint = complaintRes.rows[0];

//     const studentEmail = `${complaint.kerberos_id.trim().toLowerCase()}@iitd.ac.in`;
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     await pool.query(
//       `INSERT INTO student_action_otps (complaint_id, otp, purpose)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (complaint_id) DO UPDATE 
//        SET otp = EXCLUDED.otp, purpose = EXCLUDED.purpose, created_at = CURRENT_TIMESTAMP`,
//       [id, otp, purpose || 'verify']
//     );

//     // 📧 ONLY SEND OTP TO STUDENT
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: `OTP to ${purpose === 'reject' ? 'Reject' : 'Confirm'} Fix for Issue #${id}`,
//       text: `Your OTP is: ${otp}`
//     });

//     res.json({ success: true, emailSentTo: studentEmail });
//   } catch (err) {
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// // Step 2: Verify Student Action OTP -> Updates Status & Sends Rejection Notification if Rejected
// app.post('/api/complaints/verify-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userOtp = req.body.userOtp || req.body.otp;
//     const isApproved = req.body.approved === true || req.body.approved === 'true';
//     const rejectionReason = req.body.rejection_reason || req.body.rejectionReason;

//     const cleanOtp = userOtp ? userOtp.toString().trim() : '';
//     if (!cleanOtp) return res.status(400).json({ error: 'OTP is required' });

//     const otpResult = await pool.query(`SELECT * FROM student_action_otps WHERE complaint_id = $1`, [id]);
//     if (otpResult.rows.length === 0 || otpResult.rows[0].otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     let updatedComplaint;

//     if (isApproved) {
//       const resQuery = await pool.query(`UPDATE complaints SET status = 'Resolved' WHERE id = $1 RETURNING *`, [id]);
//       updatedComplaint = resQuery.rows[0];
//     } else {
//       const resQuery = await pool.query(
//         `UPDATE complaints 
//          SET status = 'Pending', rejection_count = COALESCE(rejection_count, 0) + 1, last_rejection_reason = $1 
//          WHERE id = $2 RETURNING *`,
//         [rejectionReason || 'Fix rejected by student.', id]
//       );
//       updatedComplaint = resQuery.rows[0];

//       // 📧 SEND REJECTION NOTIFICATION TO CARETAKER ONLY AFTER VERIFICATION
//       const caretakerEmail = getCaretakerEmail(updatedComplaint.hostel_name);
//       transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: caretakerEmail,
//         subject: `⚠️ Fix Rejected for Issue #${id} (${updatedComplaint.hostel_name})`,
//         text: `The student (${updatedComplaint.kerberos_id}) rejected the fix for Issue #${id}.\n\nReason: ${rejectionReason || 'No specific reason given.'}\n\nThe complaint has been reopened as 'Pending'.`
//       }).catch(err => console.error("Mail error:", err));
//     }

//     await pool.query(`DELETE FROM student_action_otps WHERE complaint_id = $1`, [id]);

//     return res.json({ success: true, complaint: updatedComplaint });
//   } catch (err) {
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// module.exports = app;



// const express = require('express');
// const { Pool } = require('pg');
// const nodemailer = require('nodemailer');
// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');

// const app = express();

// app.use(express.json({ limit: '4mb' }));
// app.use(express.urlencoded({ limit: '4mb', extended: true }));

// // SSL & Connection Pool Setup
// const dbUrl = (process.env.DATABASE_URL || '').split('?')[0];
// const pool = new Pool({
//   connectionString: dbUrl || process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
//   max: 1,
//   connectionTimeoutMillis: 10000
// });

// pool.on('error', (err) => console.error('PG Pool error:', err.message || err));

// // Lazy Database Table Setup
// let dbInitialized = false;
// const ensureDb = async () => {
//   if (dbInitialized) return;
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS pending_otps (
//         kerberos VARCHAR(50) PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         hostel VARCHAR(100) NOT NULL,
//         category VARCHAR(100) NOT NULL,
//         description TEXT NOT NULL,
//         photo_url TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//       CREATE TABLE IF NOT EXISTS caretaker_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         action_type VARCHAR(50),
//         fix_photo TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//       CREATE TABLE IF NOT EXISTS student_action_otps (
//         complaint_id INT PRIMARY KEY,
//         otp VARCHAR(10) NOT NULL,
//         purpose VARCHAR(20) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS issue_photo TEXT;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS fix_photo TEXT;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rejection_count INT DEFAULT 0;
//       ALTER TABLE complaints ADD COLUMN IF NOT EXISTS last_rejection_reason TEXT;
//     `);
//     dbInitialized = true;
//   } catch (err) {
//     console.error("DB setup notice:", err.message || err);
//   }
// };

// app.use(async (req, res, next) => {
//   await ensureDb();
//   next();
// });

// // Cloudinary Configuration
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // Multer Storage with strict 3.5MB cap to respect Vercel's 4.5MB payload ceiling
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 3.5 * 1024 * 1024 } // 3.5 MB
// });

// const uploadToCloudinary = (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'complaints' },
//       (error, result) => { if (result) resolve(result.secure_url); else reject(error); }
//     );
//     stream.end(fileBuffer);
//   });
// };

// // 🛠️ NODEMAILER FIX: Use Port 465 with Secure SSL & Timeouts to prevent ETIMEDOUT on Vercel
// // const transporter = nodemailer.createTransport({
// //   host: 'smtp.gmail.com',
// //   port: 465,
// //   secure: true, // SSL
// //   auth: {
// //     user: process.env.EMAIL_USER,
// //     pass: process.env.EMAIL_PASS
// //   },
// //   connectionTimeout: 10000, // 10s connection timeout
// //   greetingTimeout: 5000,    // 5s greeting timeout
// //   socketTimeout: 10000
// // });

// // --- Nodemailer Transporter using Gmail OAuth2 ---
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     type: 'OAuth2',
//     user: process.env.EMAIL_USER,
//     clientId: process.env.GMAIL_CLIENT_ID,
//     clientSecret: process.env.GMAIL_CLIENT_SECRET,
//     refreshToken: process.env.GMAIL_REFRESH_TOKEN
//   }
// });

// function getCaretakerEmail(hostelName) {
//   const map = { 'Aravali': 'aashishraj0310@gmail.com' };
//   return map[hostelName] || 'aashishraj0310@gmail.com';
// }

// // Error handling middleware for oversized files
// app.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
//     return res.status(400).json({ error: 'Image size too large. Please upload an image under 3.5MB.' });
//   }
//   next(err);
// });

// // ==========================================
// // 📍 API ENDPOINTS
// // ==========================================

// // GET Complaints
// app.get('/api/complaints', async (req, res) => {
//   const { hostel } = req.query;
//   try {
//     let query = `SELECT *, COALESCE(rejection_count, 0) as rejection_count,
//                  EXTRACT(EPOCH FROM (NOW() - resolved_at))/3600 as hours_since_fix
//                  FROM complaints`;
//     let params = [];
//     if (hostel && hostel !== 'ALL') {
//       query += ` WHERE hostel_name = $1`;
//       params.push(hostel);
//     }
//     query += ` ORDER BY created_at DESC`;
//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message || 'Failed to fetch complaints' });
//   }
// });

// // 1️⃣ STUDENT COMPLAINT SUBMISSION FLOW
// app.post('/api/complaints/request-submission-otp', upload.any(), async (req, res) => {
//   try {
//     const hostel = req.body.hostel_name || req.body.hostel;
//     const kerberos = req.body.kerberos_id || req.body.kerberos;
//     const category = req.body.category;
//     const description = req.body.description;

//     if (!hostel || !kerberos || !category || !description) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     let photoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) {
//       photoUrl = await uploadToCloudinary(file.buffer);
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const cleanKerberos = kerberos.trim().toLowerCase();
//     const studentEmail = `${cleanKerberos}@iitd.ac.in`;

//     await pool.query(
//       `INSERT INTO pending_otps (kerberos, otp, hostel, category, description, photo_url)
//        VALUES ($1, $2, $3, $4, $5, $6)
//        ON CONFLICT (kerberos) DO UPDATE 
//        SET otp = EXCLUDED.otp, hostel = EXCLUDED.hostel, category = EXCLUDED.category, 
//            description = EXCLUDED.description, photo_url = EXCLUDED.photo_url, created_at = CURRENT_TIMESTAMP`,
//       [cleanKerberos, otp, hostel, category, description, photoUrl]
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: 'OTP for Complaint Submission',
//       text: `Your OTP for submitting the complaint is: ${otp}`
//     });

//     res.json({ success: true, tempId: cleanKerberos, emailSentTo: studentEmail });
//   } catch (err) {
//     console.error("Submission OTP Error:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const otp = req.body.userOtp || req.body.otp;
//     const kerberos = req.body.tempId || req.body.kerberos || req.body.kerberos_id;

//     const cleanOtp = otp ? otp.toString().trim() : '';
//     let cleanKerberos = kerberos ? kerberos.toString().trim().toLowerCase() : '';

//     if (!cleanOtp) return res.status(400).json({ error: 'OTP code is required' });

//     const pendingResult = await pool.query(`SELECT * FROM pending_otps WHERE kerberos = $1`, [cleanKerberos]);
//     let pending = pendingResult.rows[0];

//     if (!pending) {
//       const pendingByOtp = await pool.query(`SELECT * FROM pending_otps WHERE otp = $1 ORDER BY created_at DESC LIMIT 1`, [cleanOtp]);
//       if (pendingByOtp.rows.length > 0) pending = pendingByOtp.rows[0];
//     }

//     if (!pending || pending.otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     const result = await pool.query(
//       `INSERT INTO complaints (hostel_name, kerberos_id, category, description, issue_photo, status)
//        VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING *`,
//       [pending.hostel, pending.kerberos, pending.category, pending.description, pending.photo_url]
//     );

//     await pool.query(`DELETE FROM pending_otps WHERE kerberos = $1`, [pending.kerberos]);

//     const caretakerEmail = getCaretakerEmail(pending.hostel);
//     transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `🚨 New Maintenance Request: ${pending.hostel}`,
//       text: `A new complaint has been lodged by student ${pending.kerberos}:\n\nCategory: ${pending.category}\nDescription: ${pending.description}`
//     }).catch(err => console.error("Mail error:", err));

//     return res.json({ success: true, complaint: result.rows[0] });
//   } catch (err) {
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// // 2️⃣ CARETAKER FIX SUBMISSION FLOW
// app.post('/api/complaints/request-caretaker-otp/:id', upload.any(), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const action_type = req.body.action_type || 'Repaired';

//     let fixPhotoUrl = null;
//     const file = req.files && req.files.length > 0 ? req.files[0] : null;
//     if (file) fixPhotoUrl = await uploadToCloudinary(file.buffer);

//     const complaintRes = await pool.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
//     if (complaintRes.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });
//     const complaint = complaintRes.rows[0];

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const caretakerEmail = getCaretakerEmail(complaint.hostel_name);

//     await pool.query(
//       `INSERT INTO caretaker_otps (complaint_id, otp, action_type, fix_photo)
//        VALUES ($1, $2, $3, $4)
//        ON CONFLICT (complaint_id) DO UPDATE 
//        SET otp = EXCLUDED.otp, action_type = EXCLUDED.action_type, fix_photo = EXCLUDED.fix_photo, created_at = CURRENT_TIMESTAMP`,
//       [id, otp, action_type, fixPhotoUrl]
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `Verification OTP for Caretaker Action (Issue #${id})`,
//       text: `Your OTP to mark issue #${id} as fixed is: ${otp}`
//     });

//     res.json({ success: true, emailSentTo: caretakerEmail });
//   } catch (err) {
//     console.error("Caretaker OTP Request Error:", err.message || err);
//     res.status(500).json({ error: err.message || 'Failed to send Caretaker OTP' });
//   }
// });

// app.post('/api/complaints/verify-caretaker-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userOtp = req.body.userOtp || req.body.otp;
//     const cleanOtp = userOtp ? userOtp.toString().trim() : '';

//     if (!cleanOtp) return res.status(400).json({ error: 'OTP code is required' });

//     const otpResult = await pool.query(`SELECT * FROM caretaker_otps WHERE complaint_id = $1`, [id]);
//     if (otpResult.rows.length === 0 || otpResult.rows[0].otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     const caretakerData = otpResult.rows[0];

//     const updated = await pool.query(
//       `UPDATE complaints 
//        SET status = 'Awaiting Student Verification', fix_photo = $1, resolved_at = CURRENT_TIMESTAMP
//        WHERE id = $2 RETURNING *`,
//       [caretakerData.fix_photo, id]
//     );

//     await pool.query(`DELETE FROM caretaker_otps WHERE complaint_id = $1`, [id]);

//     const complaint = updated.rows[0];
//     const studentEmail = `${complaint.kerberos_id.trim().toLowerCase()}@iitd.ac.in`;

//     transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: `🛠️ Maintenance Request #${id} Resolved - Verification Needed`,
//       text: `Hello,\n\nThe caretaker has marked your maintenance complaint (Category: ${complaint.category}) as fixed.\n\nPlease log in to the portal to view the proof photo and confirm or reject the fix.`
//     }).catch(err => console.error("Mail error:", err));

//     return res.json({ success: true, complaint: complaint });
//   } catch (err) {
//     return res.status(500).json({ error: err.message || 'Failed to verify Caretaker OTP' });
//   }
// });

// // 3️⃣ STUDENT FIX VERIFICATION / REJECTION FLOW
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { purpose } = req.body;

//     const complaintRes = await pool.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
//     if (complaintRes.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });
//     const complaint = complaintRes.rows[0];

//     const studentEmail = `${complaint.kerberos_id.trim().toLowerCase()}@iitd.ac.in`;
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     await pool.query(
//       `INSERT INTO student_action_otps (complaint_id, otp, purpose)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (complaint_id) DO UPDATE 
//        SET otp = EXCLUDED.otp, purpose = EXCLUDED.purpose, created_at = CURRENT_TIMESTAMP`,
//       [id, otp, purpose || 'verify']
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: `OTP to ${purpose === 'reject' ? 'Reject' : 'Confirm'} Fix for Issue #${id}`,
//       text: `Your OTP is: ${otp}`
//     });

//     res.json({ success: true, emailSentTo: studentEmail });
//   } catch (err) {
//     res.status(500).json({ error: err.message || 'Failed to send OTP' });
//   }
// });

// app.post('/api/complaints/verify-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userOtp = req.body.userOtp || req.body.otp;
//     const isApproved = req.body.approved === true || req.body.approved === 'true';
//     const rejectionReason = req.body.rejection_reason || req.body.rejectionReason;

//     const cleanOtp = userOtp ? userOtp.toString().trim() : '';
//     if (!cleanOtp) return res.status(400).json({ error: 'OTP is required' });

//     const otpResult = await pool.query(`SELECT * FROM student_action_otps WHERE complaint_id = $1`, [id]);
//     if (otpResult.rows.length === 0 || otpResult.rows[0].otp !== cleanOtp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP' });
//     }

//     let updatedComplaint;

//     if (isApproved) {
//       const resQuery = await pool.query(`UPDATE complaints SET status = 'Resolved' WHERE id = $1 RETURNING *`, [id]);
//       updatedComplaint = resQuery.rows[0];
//     } else {
//       const resQuery = await pool.query(
//         `UPDATE complaints 
//          SET status = 'Pending', rejection_count = COALESCE(rejection_count, 0) + 1, last_rejection_reason = $1 
//          WHERE id = $2 RETURNING *`,
//         [rejectionReason || 'Fix rejected by student.', id]
//       );
//       updatedComplaint = resQuery.rows[0];

//       const caretakerEmail = getCaretakerEmail(updatedComplaint.hostel_name);
//       transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: caretakerEmail,
//         subject: `⚠️ Fix Rejected for Issue #${id} (${updatedComplaint.hostel_name})`,
//         text: `The student (${updatedComplaint.kerberos_id}) rejected the fix for Issue #${id}.\n\nReason: ${rejectionReason || 'No specific reason given.'}\n\nThe complaint has been reopened as 'Pending'.`
//       }).catch(err => console.error("Mail error:", err));
//     }

//     await pool.query(`DELETE FROM student_action_otps WHERE complaint_id = $1`, [id]);

//     return res.json({ success: true, complaint: updatedComplaint });
//   } catch (err) {
//     return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
//   }
// });

// module.exports = app;



// import express from 'express';
// import multer from 'multer';
// import nodemailer from 'nodemailer';
// import pg from 'pg';

// const app = express();
// const { Pool } = pg;

// // Built-in CORS headers (Zero external dependencies)
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }
//   next();
// });

// app.use(express.json({ limit: '4mb' }));
// app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// // --- PostgreSQL Pool Setup ---
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });

// // --- Multer Configuration (3.5MB Limit) ---
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 3.5 * 1024 * 1024 }
// });

// // --- Nodemailer Transporter (Gmail OAuth2 over Port 443) ---
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     type: 'OAuth2',
//     user: process.env.EMAIL_USER,
//     clientId: process.env.GMAIL_CLIENT_ID,
//     clientSecret: process.env.GMAIL_CLIENT_SECRET,
//     refreshToken: process.env.GMAIL_REFRESH_TOKEN
//   }
// });

// // Helper: Caretaker Email Mapping
// function getCaretakerEmail(hostel) {
//   return process.env.CARETAKER_EMAIL || process.env.EMAIL_USER;
// }

// // Helper: Generate 6-digit OTP
// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// // In-Memory OTP Store
// const otpStore = new Map();

// // =================================================================
// // 1. STUDENT SUBMIT COMPLAINT: REQUEST OTP
// // =================================================================
// app.post('/api/complaints/request-submission-otp', upload.any(), async (req, res) => {
//   try {
//     const hostel_name = req.body.hostel_name;
//     const kerberos_id = req.body.kerberos_id;
//     const category = req.body.category;
//     const description = req.body.description;

//     if (!hostel_name || !kerberos_id || !category || !description) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;
//     const studentEmail = `${kerberos_id.trim()}@iitd.ac.in`;
//     const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
//     const otp = generateOTP();

//     otpStore.set(tempId, {
//       otp,
//       kerberos_id: kerberos_id.trim(),
//       hostel_name,
//       category,
//       description,
//       issue_photo: uploadedFile ? uploadedFile.buffer.toString('base64') : null,
//       expiresAt: Date.now() + 5 * 60 * 1000
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: '🔑 OTP for Hostel Complaint Submission',
//       text: `Your OTP for submitting the complaint is: ${otp}\nThis OTP is valid for 5 minutes.`
//     });

//     return res.json({ 
//       success: true, 
//       tempId: tempId, 
//       emailSentTo: studentEmail 
//     });
//   } catch (err) {
//     console.error("Error in request-submission-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to send submission OTP" });
//   }
// });

// // =================================================================
// // 2. STUDENT VERIFY OTP & POST COMPLAINT
// // =================================================================
// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const { tempId, userOtp } = req.body;

//     if (!tempId || !userOtp) {
//       return res.status(400).json({ error: "Temp ID and OTP are required" });
//     }

//     const pending = otpStore.get(tempId);

//     if (!pending || pending.expiresAt < Date.now()) {
//       return res.status(400).json({ error: "OTP expired or invalid" });
//     }

//     if (pending.otp !== String(userOtp).trim()) {
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     const insertQuery = `
//       INSERT INTO complaints (kerberos_id, hostel_name, category, description, issue_photo, status, created_at)
//       VALUES ($1, $2, $3, $4, $5, 'Pending', NOW())
//       RETURNING *;
//     `;
//     const result = await pool.query(insertQuery, [
//       pending.kerberos_id,
//       pending.hostel_name,
//       pending.category,
//       pending.description,
//       pending.issue_photo || ''
//     ]);

//     otpStore.delete(tempId);

//     // Notify Caretaker
//     try {
//       const caretakerEmail = getCaretakerEmail(pending.hostel_name);
//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: caretakerEmail,
//         subject: `🚨 New Maintenance Request: ${pending.hostel_name}`,
//         text: `A new complaint has been lodged by student (${pending.kerberos_id}@iitd.ac.in):\n\nHostel: ${pending.hostel_name}\nCategory: ${pending.category}\nDescription: ${pending.description}`
//       });
//     } catch (mailErr) {
//       console.error("Failed to send caretaker notification email:", mailErr);
//     }

//     return res.json({ success: true, complaint: result.rows[0] });
//   } catch (err) {
//     console.error("Error in verify-submission-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to verify submission OTP" });
//   }
// });

// // =================================================================
// // 3. CARETAKER FIX ACTION: REQUEST OTP
// // =================================================================
// app.post('/api/complaints/request-caretaker-otp/:id', upload.any(), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const action_type = req.body.action_type || 'Repaired';
//     const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;

//     const complaintRes = await pool.query('SELECT * FROM complaints WHERE id = $1', [id]);
//     if (complaintRes.rows.length === 0) {
//       return res.status(404).json({ error: "Complaint not found" });
//     }

//     const complaint = complaintRes.rows[0];
//     const caretakerEmail = getCaretakerEmail(complaint.hostel_name);
//     const otp = generateOTP();

//     otpStore.set(`caretaker_fix_${id}`, {
//       otp,
//       complaintId: id,
//       action_type,
//       fix_photo: uploadedFile ? uploadedFile.buffer.toString('base64') : null,
//       expiresAt: Date.now() + 5 * 60 * 1000
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `🔑 OTP to Verify Fix for Issue #${id}`,
//       text: `Your OTP to submit resolution proof for Issue #${id} (${complaint.hostel_name}) is: ${otp}`
//     });

//     return res.json({ success: true, emailSentTo: caretakerEmail });
//   } catch (err) {
//     console.error("Error in request-caretaker-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to send Caretaker OTP" });
//   }
// });

// // =================================================================
// // 4. CARETAKER FIX ACTION: VERIFY OTP
// // =================================================================
// app.post('/api/complaints/verify-caretaker-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp } = req.body;

//     const pendingKey = `caretaker_fix_${id}`;
//     const pending = otpStore.get(pendingKey);

//     if (!pending || pending.expiresAt < Date.now()) {
//       return res.status(400).json({ error: "OTP expired or invalid" });
//     }

//     if (pending.otp !== String(userOtp).trim()) {
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     const updateQuery = `
//       UPDATE complaints 
//       SET status = 'Awaiting Verification', fix_photo = $1, updated_at = NOW() 
//       WHERE id = $2 
//       RETURNING *;
//     `;
//     const updateResult = await pool.query(updateQuery, [pending.fix_photo || '', id]);
//     otpStore.delete(pendingKey);

//     const complaint = updateResult.rows[0];

//     // Notify Student
//     if (complaint && complaint.kerberos_id) {
//       try {
//         const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;
//         await transporter.sendMail({
//           from: process.env.EMAIL_USER,
//           to: studentEmail,
//           subject: `🔧 Maintenance Issue #${id} Fixed - Verification Required`,
//           text: `The caretaker has uploaded proof of fix for your complaint (#${id}). Please log into the portal to verify and confirm resolution.`
//         });
//       } catch (mailErr) {
//         console.error("Failed to send student notification email:", mailErr);
//       }
//     }

//     return res.json({ success: true, complaint });
//   } catch (err) {
//     console.error("Error in verify-caretaker-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to verify Caretaker OTP" });
//   }
// });

// // =================================================================
// // 5. STUDENT VERIFICATION / REJECTION: SEND OTP
// // =================================================================
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { purpose } = req.body;

//     const complaintRes = await pool.query('SELECT * FROM complaints WHERE id = $1', [id]);
//     if (complaintRes.rows.length === 0) {
//       return res.status(404).json({ error: "Complaint not found" });
//     }

//     const complaint = complaintRes.rows[0];
//     const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;
//     const otp = generateOTP();

//     otpStore.set(`student_confirm_${id}`, {
//       otp,
//       purpose,
//       expiresAt: Date.now() + 5 * 60 * 1000
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: `🔑 OTP to ${purpose === 'verify' ? 'Confirm Fix' : 'Reject Fix'} for Issue #${id}`,
//       text: `Your OTP to ${purpose === 'verify' ? 'confirm resolution' : 'reject resolution'} for Issue #${id} is: ${otp}`
//     });

//     return res.json({ success: true, emailSentTo: studentEmail });
//   } catch (err) {
//     console.error("Error in send-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to send OTP" });
//   }
// });

// // =================================================================
// // 6. STUDENT VERIFICATION / REJECTION: VERIFY OTP
// // =================================================================
// app.post('/api/complaints/verify-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp, approved, rejection_reason } = req.body;

//     const pendingKey = `student_confirm_${id}`;
//     const pending = otpStore.get(pendingKey);

//     if (!pending || pending.expiresAt < Date.now()) {
//       return res.status(400).json({ error: "OTP expired or invalid" });
//     }

//     if (pending.otp !== String(userOtp).trim()) {
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     let updateQuery = '';
//     let queryParams = [];

//     if (approved) {
//       updateQuery = `UPDATE complaints SET status = 'Resolved', updated_at = NOW() WHERE id = $1 RETURNING *;`;
//       queryParams = [id];
//     } else {
//       updateQuery = `
//         UPDATE complaints 
//         SET status = 'Pending', 
//             rejection_count = COALESCE(rejection_count, 0) + 1, 
//             last_rejection_reason = $1, 
//             updated_at = NOW() 
//         WHERE id = $2 
//         RETURNING *;
//       `;
//       queryParams = [rejection_reason || 'No specific reason given.', id];
//     }

//     const updateResult = await pool.query(updateQuery, queryParams);
//     otpStore.delete(pendingKey);

//     return res.json({ success: true, complaint: updateResult.rows[0] });
//   } catch (err) {
//     console.error("Error in verify-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to process verification" });
//   }
// });

// // =================================================================
// // 7. GET COMPLAINTS (WITH HOSTEL FILTER)
// // =================================================================
// app.get('/api/complaints', async (req, res) => {
//   try {
//     const { hostel } = req.query;
//     let query = 'SELECT *, EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 AS hours_since_fix FROM complaints';
//     let queryParams = [];

//     if (hostel && hostel !== 'ALL') {
//       query += ' WHERE hostel_name = $1';
//       queryParams.push(hostel);
//     }

//     query += ' ORDER BY created_at DESC;';

//     const result = await pool.query(query, queryParams);
//     return res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching complaints:", err);
//     return res.status(500).json({ error: "Failed to fetch complaints" });
//   }
// });

// // Multer error handling middleware
// app.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
//     return res.status(400).json({ error: "Image size too large. Maximum limit is 3.5 MB." });
//   }
//   return res.status(500).json({ error: err.message || "Internal Server Error" });
// });

// export default app;


// import express from 'express';
// import multer from 'multer';
// import nodemailer from 'nodemailer';
// import pg from 'pg';

// const app = express();
// const { Pool } = pg;

// // Built-in CORS headers
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }
//   next();
// });

// app.use(express.json({ limit: '4mb' }));
// app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// // --- PostgreSQL Pool Setup ---
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });

// // --- Multer Configuration ---
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 3.5 * 1024 * 1024 }
// });

// // --- Nodemailer Transporter (Gmail OAuth2) ---
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     type: 'OAuth2',
//     user: process.env.EMAIL_USER,
//     clientId: process.env.GMAIL_CLIENT_ID,
//     clientSecret: process.env.GMAIL_CLIENT_SECRET,
//     refreshToken: process.env.GMAIL_REFRESH_TOKEN
//   }
// });

// function getCaretakerEmail(hostel) {
//   return process.env.CARETAKER_EMAIL || process.env.EMAIL_USER;
// }

// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// const otpStore = new Map();

// // =================================================================
// // 1. STUDENT SUBMIT COMPLAINT: REQUEST OTP
// // =================================================================
// app.post('/api/complaints/request-submission-otp', upload.any(), async (req, res) => {
//   try {
//     const hostel_name = req.body.hostel_name;
//     const kerberos_id = req.body.kerberos_id;
//     const category = req.body.category;
//     const description = req.body.description;

//     if (!hostel_name || !kerberos_id || !category || !description) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;
//     const studentEmail = `${kerberos_id.trim()}@iitd.ac.in`;
//     const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
//     const otp = generateOTP();

//     otpStore.set(tempId, {
//       otp,
//       kerberos_id: kerberos_id.trim(),
//       hostel_name,
//       category,
//       description,
//       issue_photo: uploadedFile ? `data:${uploadedFile.mimetype};base64,${uploadedFile.buffer.toString('base64')}` : null,
//       expiresAt: Date.now() + 5 * 60 * 1000
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: '🔑 OTP for Hostel Complaint Submission',
//       text: `Your OTP for submitting the complaint is: ${otp}\nThis OTP is valid for 5 minutes.`
//     });

//     return res.json({ 
//       success: true, 
//       tempId: tempId, 
//       emailSentTo: studentEmail 
//     });
//   } catch (err) {
//     console.error("Error in request-submission-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to send submission OTP" });
//   }
// });

// // =================================================================
// // 2. STUDENT VERIFY OTP & POST COMPLAINT
// // =================================================================
// app.post('/api/complaints/verify-submission-otp', async (req, res) => {
//   try {
//     const { tempId, userOtp } = req.body;

//     if (!tempId || !userOtp) {
//       return res.status(400).json({ error: "Temp ID and OTP are required" });
//     }

//     const pending = otpStore.get(tempId);

//     if (!pending || pending.expiresAt < Date.now()) {
//       return res.status(400).json({ error: "OTP expired or invalid" });
//     }

//     if (pending.otp !== String(userOtp).trim()) {
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     const insertQuery = `
//       INSERT INTO complaints (kerberos_id, hostel_name, category, description, issue_photo, status, created_at)
//       VALUES ($1, $2, $3, $4, $5, 'Pending', NOW())
//       RETURNING *;
//     `;
//     const result = await pool.query(insertQuery, [
//       pending.kerberos_id,
//       pending.hostel_name,
//       pending.category,
//       pending.description,
//       pending.issue_photo || ''
//     ]);

//     otpStore.delete(tempId);

//     try {
//       const caretakerEmail = getCaretakerEmail(pending.hostel_name);
//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: caretakerEmail,
//         subject: `🚨 New Maintenance Request: ${pending.hostel_name}`,
//         text: `A new complaint has been lodged by student (${pending.kerberos_id}@iitd.ac.in):\n\nHostel: ${pending.hostel_name}\nCategory: ${pending.category}\nDescription: ${pending.description}`
//       });
//     } catch (mailErr) {
//       console.error("Failed to send caretaker notification email:", mailErr);
//     }

//     return res.json({ success: true, complaint: result.rows[0] });
//   } catch (err) {
//     console.error("Error in verify-submission-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to verify submission OTP" });
//   }
// });

// // =================================================================
// // 3. CARETAKER FIX ACTION: REQUEST OTP
// // =================================================================
// app.post('/api/complaints/request-caretaker-otp/:id', upload.any(), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const action_type = req.body.action_type || 'Repaired';
//     const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;

//     const complaintRes = await pool.query('SELECT * FROM complaints WHERE id = $1', [id]);
//     if (complaintRes.rows.length === 0) {
//       return res.status(404).json({ error: "Complaint not found" });
//     }

//     const complaint = complaintRes.rows[0];
//     const caretakerEmail = getCaretakerEmail(complaint.hostel_name);
//     const otp = generateOTP();

//     otpStore.set(`caretaker_fix_${id}`, {
//       otp,
//       complaintId: id,
//       action_type,
//       fix_photo: uploadedFile ? `data:${uploadedFile.mimetype};base64,${uploadedFile.buffer.toString('base64')}` : null,
//       expiresAt: Date.now() + 5 * 60 * 1000
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: caretakerEmail,
//       subject: `🔑 OTP to Verify Fix for Issue #${id}`,
//       text: `Your OTP to submit resolution proof for Issue #${id} (${complaint.hostel_name}) is: ${otp}`
//     });

//     return res.json({ success: true, emailSentTo: caretakerEmail });
//   } catch (err) {
//     console.error("Error in request-caretaker-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to send Caretaker OTP" });
//   }
// });

// // =================================================================
// // 4. CARETAKER FIX ACTION: VERIFY OTP
// // =================================================================
// app.post('/api/complaints/verify-caretaker-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp } = req.body;

//     const pendingKey = `caretaker_fix_${id}`;
//     const pending = otpStore.get(pendingKey);

//     if (!pending || pending.expiresAt < Date.now()) {
//       return res.status(400).json({ error: "OTP expired or invalid" });
//     }

//     if (pending.otp !== String(userOtp).trim()) {
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     const updateQuery = `
//       UPDATE complaints 
//       SET status = 'Awaiting Verification', fix_photo = $1
//       WHERE id = $2 
//       RETURNING *;
//     `;
//     const updateResult = await pool.query(updateQuery, [pending.fix_photo || '', id]);
//     otpStore.delete(pendingKey);

//     const complaint = updateResult.rows[0];

//     if (complaint && complaint.kerberos_id) {
//       try {
//         const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;
//         await transporter.sendMail({
//           from: process.env.EMAIL_USER,
//           to: studentEmail,
//           subject: `🔧 Maintenance Issue #${id} Fixed - Verification Required`,
//           text: `The caretaker has uploaded proof of fix for your complaint (#${id}). Please log into the portal to verify and confirm resolution.`
//         });
//       } catch (mailErr) {
//         console.error("Failed to send student notification email:", mailErr);
//       }
//     }

//     return res.json({ success: true, complaint });
//   } catch (err) {
//     console.error("Error in verify-caretaker-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to verify Caretaker OTP" });
//   }
// });

// // =================================================================
// // 5. STUDENT VERIFICATION / REJECTION: SEND OTP
// // =================================================================
// app.post('/api/complaints/send-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { purpose } = req.body;

//     const complaintRes = await pool.query('SELECT * FROM complaints WHERE id = $1', [id]);
//     if (complaintRes.rows.length === 0) {
//       return res.status(404).json({ error: "Complaint not found" });
//     }

//     const complaint = complaintRes.rows[0];
//     const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;
//     const otp = generateOTP();

//     otpStore.set(`student_confirm_${id}`, {
//       otp,
//       purpose,
//       expiresAt: Date.now() + 5 * 60 * 1000
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: studentEmail,
//       subject: `🔑 OTP to ${purpose === 'verify' ? 'Confirm Fix' : 'Reject Fix'} for Issue #${id}`,
//       text: `Your OTP to ${purpose === 'verify' ? 'confirm resolution' : 'reject resolution'} for Issue #${id} is: ${otp}`
//     });

//     return res.json({ success: true, emailSentTo: studentEmail });
//   } catch (err) {
//     console.error("Error in send-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to send OTP" });
//   }
// });

// // =================================================================
// // 6. STUDENT VERIFICATION / REJECTION: VERIFY OTP
// // =================================================================
// app.post('/api/complaints/verify-otp/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userOtp, approved, rejection_reason } = req.body;

//     const pendingKey = `student_confirm_${id}`;
//     const pending = otpStore.get(pendingKey);

//     if (!pending || pending.expiresAt < Date.now()) {
//       return res.status(400).json({ error: "OTP expired or invalid" });
//     }

//     if (pending.otp !== String(userOtp).trim()) {
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     let updateQuery = '';
//     let queryParams = [];

//     if (approved) {
//       updateQuery = `UPDATE complaints SET status = 'Resolved' WHERE id = $1 RETURNING *;`;
//       queryParams = [id];
//     } else {
//       updateQuery = `
//         UPDATE complaints 
//         SET status = 'Pending', 
//             rejection_count = COALESCE(rejection_count, 0) + 1, 
//             last_rejection_reason = $1 
//         WHERE id = $2 
//         RETURNING *;
//       `;
//       queryParams = [rejection_reason || 'No specific reason given.', id];
//     }

//     const updateResult = await pool.query(updateQuery, queryParams);
//     otpStore.delete(pendingKey);

//     return res.json({ success: true, complaint: updateResult.rows[0] });
//   } catch (err) {
//     console.error("Error in verify-otp:", err);
//     return res.status(500).json({ error: err.message || "Failed to process verification" });
//   }
// });

// // =================================================================
// // 7. GET COMPLAINTS
// // =================================================================
// app.get('/api/complaints', async (req, res) => {
//   try {
//     const { hostel } = req.query;

//     let query = `
//       SELECT 
//         id,
//         kerberos_id,
//         hostel_name,
//         category,
//         description,
//         COALESCE(issue_photo, '') AS issue_photo,
//         COALESCE(fix_photo, '') AS fix_photo,
//         COALESCE(status, 'Pending') AS status,
//         COALESCE(rejection_count, 0) AS rejection_count,
//         last_rejection_reason,
//         created_at,
//         EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS hours_since_fix 
//       FROM complaints
//     `;
//     let queryParams = [];

//     if (hostel && hostel !== 'ALL') {
//       query += ' WHERE hostel_name = $1';
//       queryParams.push(hostel);
//     }

//     query += ' ORDER BY created_at DESC;';

//     const result = await pool.query(query, queryParams);
//     return res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching complaints:", err);
//     return res.status(500).json({ error: "Failed to fetch complaints" });
//   }
// });

// // Multer error handling middleware
// app.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
//     return res.status(400).json({ error: "Image size too large. Maximum limit is 3.5 MB." });
//   }
//   return res.status(500).json({ error: err.message || "Internal Server Error" });
// });

// export default app;

import crypto from 'crypto';
const OTP_SECRET = process.env.OTP_SECRET || 'iitd-portal-super-secret-key-2026';
import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import pg from 'pg';

const app = express();
const { Pool } = pg;

// Built-in CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// --- PostgreSQL Pool Setup ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

b

// --- Multer Configuration ---
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 3.5 * 1024 * 1024 }
});

// --- Nodemailer Transporter (Gmail OAuth2) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN
  }
});

// Helper: Caretaker Email Mapping
function getCaretakerEmail(hostel) {
  return process.env.CARETAKER_EMAIL || "aashishraj0310@gmail.com";
}

// Helper: Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-Memory OTP Store
const otpStore = new Map();

// =================================================================
// 0. STUDENT LOGIN OTP (REQUEST & VERIFY - STATELESS)
// =================================================================
app.post('/api/student/request-login-otp', async (req, res) => {
  try {
    const { kerberos_id } = req.body;
    if (!kerberos_id || !kerberos_id.trim()) {
      return res.status(400).json({ error: "Kerberos ID is required" });
    }

    const cleanKerberos = kerberos_id.trim().toLowerCase();
    const studentEmail = `${cleanKerberos}@iitd.ac.in`;
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    // Sign payload using HMAC SHA256
    const dataToSign = `${cleanKerberos}:${otp}:${expiresAt}`;
    const hash = crypto.createHmac('sha256', OTP_SECRET).update(dataToSign).digest('hex');
    const otpToken = `${hash}:${expiresAt}`;

    await transporter.sendMail({
      from: `"Hostel Maintenance Portal" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `🔑 Student Portal Verification OTP - ${cleanKerberos}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Campus Maintenance Portal</h2>
          <p style="color: #555; font-size: 14px;">Use the following OTP to log into the Student Portal:</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #27ae60; background: #e8f8f5; padding: 10px 20px; border-radius: 6px; border: 1px dashed #27ae60; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #7f8c8d; font-size: 13px;">This OTP is valid for <strong>5 minutes</strong>.</p>
        </div>
      `
    });

    return res.json({ success: true, emailSentTo: studentEmail, otpToken });
  } catch (err) {
    console.error("Error sending student login OTP:", err);
    return res.status(500).json({ error: err.message || "Failed to send Student Login OTP" });
  }
});

app.post('/api/student/verify-login-otp', async (req, res) => {
  try {
    const { kerberos_id, userOtp, otpToken } = req.body;
    if (!kerberos_id || !userOtp || !otpToken) {
      return res.status(400).json({ error: "Missing required verification parameters" });
    }

    const cleanKerberos = kerberos_id.trim().toLowerCase();
    const [hash, expiresAtStr] = otpToken.split(':');
    const expiresAt = Number(expiresAtStr);

    if (Date.now() > expiresAt) {
      return res.status(400).json({ error: "OTP expired. Please request a new one." });
    }

    const dataToSign = `${cleanKerberos}:${String(userOtp).trim()}:${expiresAt}`;
    const expectedHash = crypto.createHmac('sha256', OTP_SECRET).update(dataToSign).digest('hex');

    if (hash !== expectedHash) {
      return res.status(400).json({ error: "Invalid OTP. Please check and try again." });
    }

    return res.json({ success: true, kerberos_id: cleanKerberos });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).json({ error: err.message || "Verification failed" });
  }
});



// =================================================================
// 1. DIRECT COMPLAINT SUBMISSION (AFTER VERIFIED STUDENT LOGIN)
// =================================================================
app.post('/api/complaints/submit-direct', upload.any(), async (req, res) => {
  try {
    const { hostel_name, kerberos_id, category, description } = req.body;

    if (!hostel_name || !kerberos_id || !category || !description) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;
    const photoDataUri = uploadedFile 
      ? `data:${uploadedFile.mimetype};base64,${uploadedFile.buffer.toString('base64')}` 
      : '';

    const insertQuery = `
      INSERT INTO complaints (kerberos_id, hostel_name, category, description, issue_photo, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'Pending', NOW())
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [
      kerberos_id.trim().toLowerCase(),
      hostel_name,
      category,
      description,
      photoDataUri
    ]);

    // Notify Caretaker
    try {
      const caretakerEmail = getCaretakerEmail(hostel_name);
      await transporter.sendMail({
        from: `"Hostel Maintenance Portal" <${process.env.EMAIL_USER}>`,
        to: caretakerEmail,
        subject: `🚨 New Maintenance Request: ${hostel_name}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #e74c3c; margin-top: 0;">🚨 New Maintenance Issue Lodged</h2>
          <p style="color: #555; font-size: 14px;">A new maintenance complaint requires your attention:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
            <tr style="background: #f8f9fa;"><td style="padding: 8px; font-weight: bold; width: 30%;">Hostel:</td><td style="padding: 8px;">${hostel_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Category:</td><td style="padding: 8px;">${category}</td></tr>
            <tr style="background: #f8f9fa;"><td style="padding: 8px; font-weight: bold;">Student:</td><td style="padding: 8px;">${kerberos_id}@iitd.ac.in</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Description:</td><td style="padding: 8px;">${description}</td></tr>
          </table>

          <p style="color: #555; font-size: 13px;">Please log into the caretaker dashboard to review details and submit resolution proof once fixed.</p>
        </div>
      `
      });
    } catch (mailErr) {
      console.error("Failed to send caretaker notification email:", mailErr);
    }

    return res.json({ success: true, complaint: result.rows[0] });
  } catch (err) {
    console.error("Error submitting direct complaint:", err);
    return res.status(500).json({ error: err.message || "Failed to submit complaint" });
  }
});


// =================================================================
// 2. STUDENT VERIFY OTP & POST COMPLAINT
// =================================================================
app.post('/api/complaints/verify-submission-otp', async (req, res) => {
  try {
    const { tempId, userOtp } = req.body;

    if (!tempId || !userOtp) {
      return res.status(400).json({ error: "Temp ID and OTP are required" });
    }

    const pending = otpStore.get(tempId);

    if (!pending || pending.expiresAt < Date.now()) {
      return res.status(400).json({ error: "OTP expired or invalid" });
    }

    if (pending.otp !== String(userOtp).trim()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const insertQuery = `
      INSERT INTO complaints (kerberos_id, hostel_name, category, description, issue_photo, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'Pending', NOW())
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [
      pending.kerberos_id,
      pending.hostel_name,
      pending.category,
      pending.description,
      pending.issue_photo || ''
    ]);

    otpStore.delete(tempId);

    // Notify Caretaker
    try {
      const caretakerEmail = getCaretakerEmail(pending.hostel_name);
      await transporter.sendMail({
        from: `"Hostel Maintenance Portal" <${process.env.EMAIL_USER}>`,
        to: caretakerEmail,
        subject: `🚨 New Maintenance Request: ${pending.hostel_name}`,
        // text: `A new complaint has been lodged by student (${pending.kerberos_id}@iitd.ac.in):\n\nHostel: ${pending.hostel_name}\nCategory: ${pending.category}\nDescription: ${pending.description}`
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #e74c3c; margin-top: 0;">🚨 New Maintenance Issue Lodged</h2>
          <p style="color: #555; font-size: 14px;">A new maintenance complaint requires your attention:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
            <tr style="background: #f8f9fa;"><td style="padding: 8px; font-weight: bold; width: 30%;">Hostel:</td><td style="padding: 8px;">${pending.hostel_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Category:</td><td style="padding: 8px;">${pending.category}</td></tr>
            <tr style="background: #f8f9fa;"><td style="padding: 8px; font-weight: bold;">Student:</td><td style="padding: 8px;">${pending.kerberos_id}@iitd.ac.in</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Description:</td><td style="padding: 8px;">${pending.description}</td></tr>
          </table>

          <p style="color: #555; font-size: 13px;">Please log into the caretaker dashboard to review details and submit resolution proof once fixed.</p>
        </div>
      `
      });
    } catch (mailErr) {
      console.error("Failed to send caretaker notification email:", mailErr);
    }

    return res.json({ success: true, complaint: result.rows[0] });
  } catch (err) {
    console.error("Error in verify-submission-otp:", err);
    return res.status(500).json({ error: err.message || "Failed to verify submission OTP" });
  }
});

// =================================================================
// 3. CARETAKER LOGIN OTP (REQUEST & VERIFY)
// =================================================================
app.post('/api/caretaker/request-login-otp', async (req, res) => {
  try {
    const { hostel_name } = req.body;
    if (!hostel_name) {
      return res.status(400).json({ error: "Hostel selection is required" });
    }

    const caretakerEmail = getCaretakerEmail(hostel_name);
    const otp = generateOTP();

    otpStore.set(`caretaker_login_${hostel_name}`, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    await transporter.sendMail({
      from: `"Hostel Maintenance Portal" <${process.env.EMAIL_USER}>`,
      to: caretakerEmail,
      subject: `🔑 Caretaker Portal Access OTP - ${hostel_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Campus Maintenance Portal</h2>
          <p style="color: #555; font-size: 14px;">Use the following OTP to log into the Caretaker Dashboard for <strong>${hostel_name} Hostel</strong>:</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2980b9; background: #ebf5fb; padding: 10px 20px; border-radius: 6px; border: 1px dashed #2980b9; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #7f8c8d; font-size: 13px;">This OTP is valid for <strong>5 minutes</strong>.</p>
        </div>
      `
    });

    return res.json({ success: true, emailSentTo: caretakerEmail });
  } catch (err) {
    console.error("Error sending caretaker login OTP:", err);
    return res.status(500).json({ error: err.message || "Failed to send Caretaker Login OTP" });
  }
});

app.post('/api/caretaker/verify-login-otp', async (req, res) => {
  try {
    const { hostel_name, userOtp } = req.body;
    const storeKey = `caretaker_login_${hostel_name}`;
    const pending = otpStore.get(storeKey);

    if (!pending || pending.expiresAt < Date.now()) {
      return res.status(400).json({ error: "OTP expired or invalid" });
    }

    if (pending.otp !== String(userOtp).trim()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    otpStore.delete(storeKey);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Verification failed" });
  }
});

// =================================================================
// 4. CARETAKER DIRECT FIX SUBMISSION 
// =================================================================
app.post('/api/complaints/submit-fix/:id', upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;

    if (!uploadedFile) {
      return res.status(400).json({ error: "Proof photo is required" });
    }

    const fixPhotoDataUri = `data:${uploadedFile.mimetype};base64,${uploadedFile.buffer.toString('base64')}`;

    const updateQuery = `
      UPDATE complaints 
      SET status = 'Awaiting Verification', fix_photo = $1
      WHERE id = $2 
      RETURNING *;
    `;
    const updateResult = await pool.query(updateQuery, [fixPhotoDataUri, id]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const complaint = updateResult.rows[0];

    // Notify Student
    if (complaint && complaint.kerberos_id) {
      try {
        const studentEmail = `${complaint.kerberos_id}@iitd.ac.in`;
        await transporter.sendMail({
          from: `"Hostel Maintenance Portal" <${process.env.EMAIL_USER}>`,
          to: studentEmail,
          subject: `🔧 Maintenance Issue #${id} Fixed - Verification Required`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #27ae60; margin-top: 0;">🔧 Work Completed on Issue #${id}</h2>
            <p style="color: #555; font-size: 14px;">The caretaker has uploaded proof of resolution for your maintenance complaint.</p>
            <p style="color: #555; font-size: 14px;">Please log into the student portal to review the proof photo and either <strong>Confirm</strong> or <strong>Reject</strong> the resolution.</p>
            <div style="margin: 20px 0; text-align: center;">
              <span style="background: #fff8e1; color: #d35400; padding: 8px 12px; border-radius: 4px; font-size: 13px; font-weight: bold;">⚠️ Auto-resolves in 24 hours if no action is taken.</span>
            </div>
          </div>
        `
        });
      } catch (mailErr) {
        console.error("Failed to send student notification email:", mailErr);
      }
    }

    return res.json({ success: true, complaint });
  } catch (err) {
    console.error("Error submitting fix:", err);
    return res.status(500).json({ error: err.message || "Failed to submit fix" });
  }
});

// =================================================================
// 5. STUDENT DIRECT VERIFICATION / REJECTION (NO OTP REQUIRED)
// =================================================================
app.post('/api/complaints/verify-direct/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, rejection_reason } = req.body;

    let updateQuery = '';
    let queryParams = [];

    if (approved) {
      updateQuery = `UPDATE complaints SET status = 'Resolved' WHERE id = $1 RETURNING *;`;
      queryParams = [id];
    } else {
      updateQuery = `
        UPDATE complaints 
        SET status = 'Pending', 
            rejection_count = COALESCE(rejection_count, 0) + 1, 
            last_rejection_reason = $1 
        WHERE id = $2 
        RETURNING *;
      `;
      queryParams = [rejection_reason || 'No specific reason given.', id];
    }

    const updateResult = await pool.query(updateQuery, queryParams);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const updatedComplaint = updateResult.rows[0];

    // SEND REJECTION EMAIL TO CARETAKER IF REJECTED
    if (!approved && updatedComplaint) {
      try {
        const caretakerEmail = getCaretakerEmail(updatedComplaint.hostel_name);
        await transporter.sendMail({
          from: `"Hostel Maintenance Portal" <${process.env.EMAIL_USER}>`,
          to: caretakerEmail,
          subject: `⚠️ Issue #${id} Fix Rejected by Student (${updatedComplaint.hostel_name})`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #c0392b; margin-top: 0;">⚠️ Resolution Rejected by Student</h2>
            <p style="color: #555; font-size: 14px;">The student (${updatedComplaint.kerberos_id}@iitd.ac.in) has <strong>rejected</strong> the fix provided for <strong>Issue #${id}</strong>.</p>
            
            <div style="background: #fdf2e9; border-left: 4px solid #e67e22; padding: 12px; margin: 15px 0; font-size: 14px; color: #a04000;">
              <strong>Student Reason:</strong> "${rejection_reason || 'No specific reason given.'}"
            </div>

            <p style="color: #555; font-size: 13px;">The issue status has been reset to <strong>Pending</strong>. Please inspect and resolve the issue.</p>
          </div>
        `
        });
      } catch (mailErr) {
        console.error("Failed to send caretaker rejection notification:", mailErr);
      }
    }

    return res.json({ success: true, complaint: updatedComplaint });

  } catch (err) {
    console.error("Error in verify-direct:", err);
    return res.status(500).json({ error: err.message || "Failed to process verification" });
  }
});


// =================================================================
// 6. GET COMPLAINTS (WITH BULLETPROOF AUTO-RESOLVE)
// =================================================================
app.get('/api/complaints', async (req, res) => {
  try {
    // 2. Auto-resolve complaints stuck in 'Awaiting%' for > 24 hours
    const autoResolveQuery = `
      UPDATE complaints 
      SET status = 'Resolved (Auto)' 
      WHERE status LIKE 'Awaiting%' 
        AND created_at < NOW() - INTERVAL '24 hours';
    `;
    await pool.query(autoResolveQuery);

    // 3. Fetch complaints list
    const { hostel } = req.query;
    let query = `
      SELECT 
        id,
        kerberos_id,
        hostel_name,
        category,
        description,
        COALESCE(issue_photo, '') AS issue_photo,
        COALESCE(fix_photo, '') AS fix_photo,
        COALESCE(status, 'Pending') AS status,
        COALESCE(rejection_count, 0) AS rejection_count,
        last_rejection_reason,
        created_at,
        EXTRACT(EPOCH FROM (NOW() - COALESCE(updated_at, created_at)))/3600 AS hours_since_fix 
      FROM complaints
    `;
    let queryParams = [];

    if (hostel && hostel !== 'ALL') {
      query += ' WHERE hostel_name = $1';
      queryParams.push(hostel);
    }

    query += ' ORDER BY created_at DESC;';

    const result = await pool.query(query, queryParams);
    return res.json(result.rows);
  } catch (err) {
    console.error("Error fetching complaints:", err);
    return res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// =================================================================
// 7. ADMIN LOGIN OTP (REQUEST & VERIFY)
// =================================================================
app.post('/api/admin/request-login-otp', async (req, res) => {
  try {
    const adminEmail = process.env.EMAIL_USER; // Uses hosting mail address directly
    const otp = generateOTP();

    otpStore.set('admin_login_session', {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    await transporter.sendMail({
      from: `"Hostel Maintenance Portal" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `🔑 Master Admin Access OTP`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Campus Maintenance Portal</h2>
          <p style="color: #555; font-size: 14px;">Use the following OTP to log into the <strong>Master Admin Console</strong>:</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #8e44ad; background: #f5eeed; padding: 10px 20px; border-radius: 6px; border: 1px dashed #8e44ad; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #7f8c8d; font-size: 13px;">This OTP is valid for <strong>5 minutes</strong>.</p>
        </div>
      `
    });

    return res.json({ success: true, emailSentTo: adminEmail });
  } catch (err) {
    console.error("Error sending admin login OTP:", err);
    return res.status(500).json({ error: err.message || "Failed to send Admin Login OTP" });
  }
});

app.post('/api/admin/verify-login-otp', async (req, res) => {
  try {
    const { userOtp } = req.body;
    const storeKey = 'admin_login_session';
    const pending = otpStore.get(storeKey);

    if (!pending || pending.expiresAt < Date.now()) {
      return res.status(400).json({ error: "OTP expired or invalid" });
    }

    if (pending.otp !== String(userOtp).trim()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    otpStore.delete(storeKey);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Verification failed" });
  }
});


// Multer error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: "Image size too large. Maximum limit is 3.5 MB." });
  }
  return res.status(500).json({ error: err.message || "Internal Server Error" });
});

export default app;