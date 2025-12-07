// Import required modules
require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'teacher123';
const PASS_THRESHOLD = parseInt(process.env.PASS_THRESHOLD) || 40;

// Ensure data directory exists (for Render persistent disk)
const fs = require('fs');
const dataDir = '/opt/render/project/data';
if (process.env.NODE_ENV === 'production') {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory:', dataDir);
    }
  } catch (err) {
    console.log('Note: Could not create data directory, using local storage');
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' folder

// Initialize SQLite database
// Use /opt/render/project/data for persistent storage on Render
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/opt/render/project/data/exam.db' 
  : './exam.db';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Create questions table if it doesn't exist
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_index INTEGER NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Questions table ready');
      // Add sample questions if database is empty
      db.get('SELECT COUNT(*) as count FROM questions', (err, row) => {
        if (!err && row.count === 0) {
          insertSampleQuestions();
        }
      });
    }
  });
  
  // Create results table for storing student exam results
  db.run(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      answers TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating results table:', err);
    } else {
      console.log('Results table ready');
    }
  });
}

// Insert sample questions
function insertSampleQuestions() {
  const sampleQuestions = [
    {
      text: 'What is 2 + 2?',
      options: ['1', '2', '3', '4'],
      correctIndex: 3
    },
    {
      text: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctIndex: 1
    },
    {
      text: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctIndex: 2
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO questions (text, option_a, option_b, option_c, option_d, correct_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  sampleQuestions.forEach(q => {
    stmt.run(q.text, q.options[0], q.options[1], q.options[2], q.options[3], q.correctIndex);
  });

  stmt.finalize();
  console.log('Sample questions inserted');
}

// ===== STUDENT API ENDPOINTS =====

// GET all questions for students (without correct answers)
app.get('/api/questions', (req, res) => {
  db.all('SELECT id, text, option_a, option_b, option_c, option_d FROM questions', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    
    // Format questions for frontend
    const questions = rows.map(row => ({
      id: row.id,
      text: row.text,
      options: [row.option_a, row.option_b, row.option_c, row.option_d]
    }));
    
    res.json(questions);
  });
});

// POST submit exam and get score
app.post('/api/submit', (req, res) => {
  const { studentName, answers } = req.body;
  
  if (!studentName || !studentName.trim()) {
    return res.status(400).json({ error: 'Student name is required' });
  }
  
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Invalid answers format' });
  }
  
  // Get all questions with correct answers
  db.all('SELECT * FROM questions', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    let correctCount = 0;
    const totalQuestions = rows.length;
    const detailedResults = [];
    
    // Check each answer and build detailed results
    rows.forEach(question => {
      const studentAnswer = answers[question.id];
      const isCorrect = studentAnswer === question.correct_index;
      
      if (isCorrect) {
        correctCount++;
      }
      
      detailedResults.push({
        questionId: question.id,
        questionText: question.text,
        options: [question.option_a, question.option_b, question.option_c, question.option_d],
        studentAnswer: studentAnswer,
        correctAnswer: question.correct_index,
        isCorrect: isCorrect
      });
    });
    
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = percentage >= PASS_THRESHOLD;
    
    // Save result to database
    db.run(
      `INSERT INTO results (student_name, total_questions, correct_answers, percentage, passed, answers)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [studentName, totalQuestions, correctCount, percentage, passed ? 1 : 0, JSON.stringify(answers)],
      function(err) {
        if (err) {
          console.error('Error saving result:', err);
        }
      }
    );
    
    res.json({
      total: totalQuestions,
      correct: correctCount,
      percentage: percentage,
      passed: passed,
      message: passed ? 'Congratulations! You passed!' : 'Sorry, you did not pass. Keep studying!',
      detailedResults: detailedResults
    });
  });
});

// ===== ADMIN API ENDPOINTS =====

// Simple admin authentication middleware
function checkAdminAuth(req, res, next) {
  const password = req.headers['admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET all questions for admin (with correct answers)
app.get('/api/admin/questions', checkAdminAuth, (req, res) => {
  db.all('SELECT * FROM questions', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const questions = rows.map(row => ({
      id: row.id,
      text: row.text,
      options: [row.option_a, row.option_b, row.option_c, row.option_d],
      correctIndex: row.correct_index
    }));
    
    res.json(questions);
  });
});

// GET all student results for admin
app.get('/api/admin/results', checkAdminAuth, (req, res) => {
  db.all(
    'SELECT * FROM results ORDER BY submitted_at DESC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      const results = rows.map(row => ({
        id: row.id,
        studentName: row.student_name,
        totalQuestions: row.total_questions,
        correctAnswers: row.correct_answers,
        percentage: row.percentage,
        passed: row.passed === 1,
        submittedAt: row.submitted_at
      }));
      
      res.json(results);
    }
  );
});

// POST add new question
app.post('/api/admin/questions', checkAdminAuth, (req, res) => {
  const { text, options, correctIndex } = req.body;
  
  // Validation
  if (!text || !options || !Array.isArray(options) || options.length !== 4 || correctIndex === undefined) {
    return res.status(400).json({ error: 'Invalid question format' });
  }
  
  if (correctIndex < 0 || correctIndex > 3) {
    return res.status(400).json({ error: 'correctIndex must be between 0 and 3' });
  }
  
  db.run(
    `INSERT INTO questions (text, option_a, option_b, option_c, option_d, correct_index)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [text, options[0], options[1], options[2], options[3], correctIndex],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, message: 'Question added successfully' });
    }
  );
});

// PUT update question
app.put('/api/admin/questions/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const { text, options, correctIndex } = req.body;
  
  // Validation
  if (!text || !options || !Array.isArray(options) || options.length !== 4 || correctIndex === undefined) {
    return res.status(400).json({ error: 'Invalid question format' });
  }
  
  if (correctIndex < 0 || correctIndex > 3) {
    return res.status(400).json({ error: 'correctIndex must be between 0 and 3' });
  }
  
  db.run(
    `UPDATE questions 
     SET text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_index = ?
     WHERE id = ?`,
    [text, options[0], options[1], options[2], options[3], correctIndex, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.json({ message: 'Question updated successfully' });
    }
  );
});

// DELETE question
app.delete('/api/admin/questions/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM questions WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  });
});

// ===== SERVE HTML PAGES =====

// Student exam page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Student exam page: http://localhost:${PORT}`);
  console.log(`Admin page: http://localhost:${PORT}/admin`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
});

// Close database on exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});
