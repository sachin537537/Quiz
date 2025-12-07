// ===== Admin Panel JavaScript =====

let adminPassword = ''; // Store admin password after login
let questions = []; // Store all questions
let editingQuestionId = null; // Track which question is being edited
let studentResults = []; // Store student results
let currentTab = 'questions'; // Track current tab

// Allow Enter key to login
document.getElementById('adminPassword')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        login();
    }
});

// Login function
function login() {
    const password = document.getElementById('adminPassword').value;
    
    if (!password) {
        alert('Please enter admin password');
        return;
    }
    
    adminPassword = password;
    
    // Try to load questions (this will validate the password)
    loadQuestions();
}

// Load all questions from server
async function loadQuestions() {
    try {
        const response = await fetch('/api/admin/questions', {
            headers: {
                'admin-password': adminPassword
            }
        });
        
        if (response.status === 401) {
            alert('Invalid admin password');
            adminPassword = '';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to load questions');
        }
        
        questions = await response.json();
        
        // Login successful - show admin content
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        
        // Render questions
        renderQuestions();
        
        // Also load results
        loadResults();
        
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Error loading questions. Please try again.');
    }
}

// Render questions list
function renderQuestions() {
    const container = document.getElementById('questionsListContainer');
    
    if (questions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No questions yet. Click "Add New Question" to create one.</p>';
        return;
    }
    
    container.innerHTML = ''; // Clear container
    
    questions.forEach((question, index) => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        
        // Question header with text and actions
        const header = document.createElement('div');
        header.className = 'question-item-header';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'question-item-text';
        textDiv.textContent = `${index + 1}. ${question.text}`;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'question-item-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-secondary';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => showEditQuestionModal(question);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteQuestion(question.id);
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        header.appendChild(textDiv);
        header.appendChild(actionsDiv);
        
        // Options list
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'question-item-options';
        
        question.options.forEach((option, optionIndex) => {
            const optionP = document.createElement('div');
            const letter = String.fromCharCode(65 + optionIndex); // A, B, C, D
            const isCorrect = optionIndex === question.correctIndex;
            
            optionP.innerHTML = `${letter}. ${option} ${isCorrect ? '<span class="correct-answer">✓ Correct Answer</span>' : ''}`;
            optionsDiv.appendChild(optionP);
        });
        
        questionItem.appendChild(header);
        questionItem.appendChild(optionsDiv);
        container.appendChild(questionItem);
    });
}

// Load student results
async function loadResults() {
    try {
        const response = await fetch('/api/admin/results', {
            headers: {
                'admin-password': adminPassword
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load results');
        }
        
        studentResults = await response.json();
        renderResults();
        
    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('resultsListContainer').innerHTML = '<p style="color: #f44336; text-align: center;">Error loading results</p>';
    }
}

// Render student results
function renderResults() {
    const container = document.getElementById('resultsListContainer');
    
    if (studentResults.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No student results yet.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    studentResults.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'question-item';
        resultItem.style.borderLeft = result.passed ? '4px solid #4CAF50' : '4px solid #f44336';
        
        const header = document.createElement('div');
        header.style.marginBottom = '10px';
        
        const studentInfo = document.createElement('div');
        studentInfo.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div>
                    <strong style="font-size: 1.2em;">${index + 1}. ${result.studentName}</strong>
                    <span style="margin-left: 15px; color: #666;">${new Date(result.submittedAt).toLocaleString()}</span>
                </div>
                <div style="font-size: 1.1em; font-weight: bold; color: ${result.passed ? '#4CAF50' : '#f44336'};">
                    ${result.percentage}% ${result.passed ? '✓ PASS' : '✗ FAIL'}
                </div>
            </div>
            <div style="display: flex; gap: 20px; color: #666;">
                <span>Total Questions: <strong>${result.totalQuestions}</strong></span>
                <span>Correct Answers: <strong style="color: #4CAF50;">${result.correctAnswers}</strong></span>
                <span>Wrong Answers: <strong style="color: #f44336;">${result.totalQuestions - result.correctAnswers}</strong></span>
            </div>
        `;
        
        header.appendChild(studentInfo);
        resultItem.appendChild(header);
        container.appendChild(resultItem);
    });
}

// Switch between tabs
function showTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.getElementById('questionsTab').style.borderBottom = tab === 'questions' ? '3px solid #4CAF50' : 'none';
    document.getElementById('resultsTab').style.borderBottom = tab === 'results' ? '3px solid #4CAF50' : 'none';
    
    // Show/hide tab content
    document.getElementById('questionsTabContent').style.display = tab === 'questions' ? 'block' : 'none';
    document.getElementById('resultsTabContent').style.display = tab === 'results' ? 'block' : 'none';
    
    // Reload results when switching to results tab
    if (tab === 'results') {
        loadResults();
    }
}

// Show modal to add new question
function showAddQuestionModal() {
    editingQuestionId = null;
    document.getElementById('modalTitle').textContent = 'Add New Question';
    document.getElementById('questionForm').reset();
    document.getElementById('questionModal').style.display = 'block';
}

// Show modal to edit existing question
function showEditQuestionModal(question) {
    editingQuestionId = question.id;
    document.getElementById('modalTitle').textContent = 'Edit Question';
    
    // Populate form with question data
    document.getElementById('questionId').value = question.id;
    document.getElementById('questionText').value = question.text;
    document.getElementById('optionA').value = question.options[0];
    document.getElementById('optionB').value = question.options[1];
    document.getElementById('optionC').value = question.options[2];
    document.getElementById('optionD').value = question.options[3];
    document.getElementById('correctAnswer').value = question.correctIndex;
    
    document.getElementById('questionModal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('questionModal').style.display = 'none';
    document.getElementById('questionForm').reset();
    editingQuestionId = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('questionModal');
    const bulkModal = document.getElementById('bulkImportModal');
    
    if (event.target === modal) {
        closeModal();
    } else if (event.target === bulkModal) {
        closeBulkImportModal();
    }
}

// Handle question form submission
document.getElementById('questionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const questionData = {
        text: document.getElementById('questionText').value,
        options: [
            document.getElementById('optionA').value,
            document.getElementById('optionB').value,
            document.getElementById('optionC').value,
            document.getElementById('optionD').value
        ],
        correctIndex: parseInt(document.getElementById('correctAnswer').value)
    };
    
    try {
        let response;
        
        if (editingQuestionId) {
            // Update existing question
            response = await fetch(`/api/admin/questions/${editingQuestionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'admin-password': adminPassword
                },
                body: JSON.stringify(questionData)
            });
        } else {
            // Add new question
            response = await fetch('/api/admin/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'admin-password': adminPassword
                },
                body: JSON.stringify(questionData)
            });
        }
        
        if (!response.ok) {
            throw new Error('Failed to save question');
        }
        
        // Success - reload questions and close modal
        alert(editingQuestionId ? 'Question updated successfully!' : 'Question added successfully!');
        closeModal();
        loadQuestions();
        
    } catch (error) {
        console.error('Error saving question:', error);
        alert('Error saving question. Please try again.');
    }
});

// Delete question
async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/questions/${questionId}`, {
            method: 'DELETE',
            headers: {
                'admin-password': adminPassword
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete question');
        }
        
        alert('Question deleted successfully!');
        loadQuestions();
        
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('Error deleting question. Please try again.');
    }
}

// ===== BULK IMPORT FUNCTIONS =====

// Show bulk import modal
function showBulkImportModal() {
    document.getElementById('bulkImportModal').style.display = 'block';
}

// Close bulk import modal
function closeBulkImportModal() {
    document.getElementById('bulkImportModal').style.display = 'none';
    document.getElementById('bulkQuestionsText').value = '';
}

// Process bulk import
async function processBulkImport() {
    const text = document.getElementById('bulkQuestionsText').value.trim();
    
    if (!text) {
        alert('Please paste your questions and answer key.');
        return;
    }
    
    try {
        // Parse the text
        const parsedQuestions = parseBulkText(text);
        
        if (parsedQuestions.length === 0) {
            alert('No valid questions found. Please check the format.');
            return;
        }
        
        // Confirm import
        if (!confirm(`Found ${parsedQuestions.length} questions. Do you want to import them?`)) {
            return;
        }
        
        // Import each question
        let successCount = 0;
        let failCount = 0;
        
        for (const question of parsedQuestions) {
            try {
                const response = await fetch('/api/admin/questions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'admin-password': adminPassword
                    },
                    body: JSON.stringify(question)
                });
                
                if (response.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                failCount++;
            }
        }
        
        // Show result
        alert(`Import complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
        
        // Reload questions and close modal
        closeBulkImportModal();
        loadQuestions();
        
    } catch (error) {
        console.error('Error processing bulk import:', error);
        alert('Error parsing questions. Please check the format and try again.');
    }
}

// Parse bulk text into question objects
function parseBulkText(text) {
    const questions = [];
    const lines = text.split('\n');
    
    // Find the ANS KEY section
    let answerKeyIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().toUpperCase().includes('ANS KEY')) {
            answerKeyIndex = i;
            break;
        }
    }
    
    if (answerKeyIndex === -1) {
        throw new Error('Answer key section not found');
    }
    
    // Parse questions (before answer key)
    const questionText = lines.slice(0, answerKeyIndex).join('\n');
    const answerLines = lines.slice(answerKeyIndex + 1);
    
    // Create answer map
    const answers = {};
    answerLines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed) {
            // Match patterns like "1 C" or "1\tC" or "1. C"
            const match = trimmed.match(/^(\d+)[.\t\s]+([A-D])/i);
            if (match) {
                answers[match[1]] = match[2].toUpperCase();
            }
        }
    });
    
    // Split questions by number pattern
    const questionPattern = /(?:^|\n)(\d+)\.\s*(.+?)(?=\n\d+\.|$)/gs;
    let match;
    
    while ((match = questionPattern.exec(questionText)) !== null) {
        const questionNum = match[1];
        const content = match[2].trim();
        
        // Parse question and options
        const parsed = parseQuestion(content);
        
        if (parsed && parsed.options.length === 4) {
            const correctAnswer = answers[questionNum];
            if (correctAnswer) {
                parsed.correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctAnswer);
                if (parsed.correctIndex !== -1) {
                    questions.push(parsed);
                }
            }
        }
    }
    
    return questions;
}

// Parse a single question and its options
function parseQuestion(content) {
    const result = {
        text: '',
        options: [],
        correctIndex: -1
    };
    
    // Remove extra whitespace
    content = content.trim();
    
    // Find where option A starts (case insensitive, allow multiple spaces)
    const optionAMatch = content.match(/\s+A\.\s+/i);
    if (!optionAMatch) {
        console.log('No option A found in:', content);
        return null;
    }
    
    // Extract question text (everything before option A)
    result.text = content.substring(0, optionAMatch.index).trim();
    
    // Extract all options using a more flexible pattern
    const optionsText = content.substring(optionAMatch.index);
    
    // Match each option - allow multiple spaces, case insensitive
    const aMatch = optionsText.match(/A\.\s+(.+?)(?=\s+B\.|$)/i);
    const bMatch = optionsText.match(/B\.\s+(.+?)(?=\s+C\.|$)/i);
    const cMatch = optionsText.match(/C\.\s+(.+?)(?=\s+D\.|$)/i);
    const dMatch = optionsText.match(/D\.\s+(.+?)$/i);
    
    if (aMatch) result.options[0] = aMatch[1].trim();
    if (bMatch) result.options[1] = bMatch[1].trim();
    if (cMatch) result.options[2] = cMatch[1].trim();
    if (dMatch) result.options[3] = dMatch[1].trim();
    
    // Debug log
    console.log('Parsed question:', result.text);
    console.log('Options:', result.options);
    
    // Verify we got all 4 options
    if (result.options.length === 4 && result.options.every(opt => opt && opt.length > 0)) {
        return result;
    }
    
    console.log('Failed to parse all options');
    return null;
}
