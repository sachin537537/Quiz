# 📝 Online Exam System

A simple, complete web application for conducting online exams. Perfect for teachers who want to create and manage multiple-choice questions and allow students to take exams online.

## ✨ Features

### For Students:
- Clean, user-friendly exam interface
- Multiple-choice questions (A, B, C, D format)
- All questions displayed on one page
- Automatic score calculation
- Instant results showing:
  - Total questions
  - Correct answers
  - Percentage score
  - Pass/Fail status

### For Teachers (Admin):
- Secure admin panel with password protection
- Add new questions with 4 options
- Edit existing questions
- Delete questions
- View all questions with correct answers marked

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: SQLite
- **Authentication**: Simple password-based admin access

## 📋 Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

## 🚀 Installation

### Step 1: Install Node.js
If you don't have Node.js installed:
1. Go to [nodejs.org](https://nodejs.org/)
2. Download and install the LTS (Long Term Support) version
3. Verify installation by opening a terminal and typing:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Install Dependencies
Open a terminal in the project folder and run:
```bash
npm install
```

This will install all required packages:
- express (web server)
- sqlite3 (database)
- dotenv (environment configuration)
- cors (cross-origin support)

## 💻 Running Locally

### Step 1: Start the Server
```bash
npm start
```

### Step 2: Open in Browser
The server will start and display:
```
Server running on http://localhost:3000
Student exam page: http://localhost:3000
Admin page: http://localhost:3000/admin
Admin password: teacher123
```

Open your browser and go to:
- **Student Exam**: `http://localhost:3000`
- **Admin Panel**: `http://localhost:3000/admin`

### Step 3: Login to Admin Panel
- Password: `teacher123` (or whatever you set in `.env` file)

## 🔧 Configuration

### Change Admin Password
Edit the `.env` file:
```
ADMIN_PASSWORD=your_new_password
```

### Change Port
Edit the `.env` file:
```
PORT=8080
```

### Change Pass Threshold
Edit the `.env` file to change the passing percentage (default is 40%):
```
PASS_THRESHOLD=60
```

## 📁 Project Structure

```
online-exam-system/
│
├── public/                 # Frontend files
│   ├── index.html         # Student exam page
│   ├── admin.html         # Admin panel page
│   ├── styles.css         # All styles (shared)
│   ├── exam.js            # Student exam logic
│   └── admin.js           # Admin panel logic
│
├── server.js              # Express server & API endpoints
├── package.json           # Project dependencies
├── .env                   # Configuration (admin password, etc.)
├── .gitignore            # Files to ignore in git
├── exam.db               # SQLite database (created automatically)
└── README.md             # This file
```

## 🌐 Deployment to Free Hosting

### Option 1: Deploy to Render (Recommended)

1. **Create a Render Account**
   - Go to [render.com](https://render.com)
   - Sign up for free

2. **Deploy from GitHub**
   - Push your code to GitHub
   - In Render dashboard, click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: online-exam-system
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
   - Add Environment Variables:
     - `ADMIN_PASSWORD`: your_admin_password
     - `PASS_THRESHOLD`: 40

3. **Deploy**
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment
   - Your app will be live at `https://your-app-name.onrender.com`

**Important Notes for Render:**
- Free tier may spin down after inactivity (takes 30s to restart)
- Database persists between deployments

### Option 2: Deploy to Railway

1. **Create a Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Node.js
   - Add environment variables in Settings:
     - `ADMIN_PASSWORD`: your_password
     - `PASS_THRESHOLD`: 40

3. **Access**
   - Railway provides a URL like `https://your-app.up.railway.app`

### Option 3: Deploy to Cyclic

1. **Create Cyclic Account**
   - Go to [cyclic.sh](https://cyclic.sh)
   - Sign up with GitHub

2. **Deploy**
   - Click "Link Your Own"
   - Select your GitHub repository
   - Add environment variables
   - Deploy

## 📝 How to Use

### For Students:
1. Open the exam page
2. Read each question carefully
3. Select one answer (A, B, C, or D) for each question
4. Click "Submit Exam"
5. View your results instantly

### For Teachers:
1. Open the admin page (`/admin`)
2. Login with admin password
3. **Add Questions**: Click "+ Add New Question"
   - Enter question text
   - Enter 4 options
   - Select the correct answer
   - Click "Save Question"
4. **Edit Questions**: Click "Edit" button on any question
5. **Delete Questions**: Click "Delete" button (with confirmation)

## 🎨 Customization

### Change Colors
Edit `public/styles.css` and modify the CSS variables at the top:
```css
:root {
    --primary-color: #4CAF50;      /* Main color (buttons, headers) */
    --secondary-color: #2196F3;    /* Secondary color */
    --danger-color: #f44336;       /* Delete button color */
}
```

### Change Page Title or Text
Edit `public/index.html` or `public/admin.html`:
```html
<h1>📝 Online Exam</h1>  <!-- Change this to your school name -->
```

### Add More Sample Questions
Edit `server.js` and find the `insertSampleQuestions()` function. Add more objects to the `sampleQuestions` array.

## 🐛 Troubleshooting

**Problem**: Server won't start
- **Solution**: Make sure port 3000 is not in use, or change PORT in `.env`

**Problem**: Can't login to admin
- **Solution**: Check the admin password in `.env` file

**Problem**: Database error
- **Solution**: Delete `exam.db` file and restart server (creates fresh database)

**Problem**: Questions not loading
- **Solution**: Check browser console (F12) for errors

## 📄 API Endpoints

For developers who want to integrate or extend:

### Student Endpoints:
- `GET /api/questions` - Get all questions (without correct answers)
- `POST /api/submit` - Submit exam answers and get score

### Admin Endpoints (require `admin-password` header):
- `GET /api/admin/questions` - Get all questions with answers
- `POST /api/admin/questions` - Add new question
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question

## 📜 License

MIT License - Feel free to use this for your classes!

## 🤝 Support

If you encounter any issues:
1. Check this README
2. Look for error messages in the browser console (F12)
3. Check the terminal where the server is running

---

**Created with ❤️ for teachers and students**

Happy teaching! 📚
