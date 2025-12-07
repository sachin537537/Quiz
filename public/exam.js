// ===== Student Exam JavaScript =====

let questions = []; // Store all questions
let studentAnswers = {}; // Store student's answers

// Load questions when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
});

// Fetch questions from server
async function loadQuestions() {
    try {
        const response = await fetch('/api/questions');
        
        if (!response.ok) {
            throw new Error('Failed to load questions');
        }
        
        questions = await response.json();
        
        // Hide loading message
        document.getElementById('loading').style.display = 'none';
        
        // Show exam form
        document.getElementById('examForm').style.display = 'block';
        
        // Render questions
        renderQuestions();
        
    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('loading').textContent = 'Error loading questions. Please refresh the page.';
    }
}

// Render all questions on the page
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = ''; // Clear container
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        
        // Question text with number
        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.textContent = `${index + 1}. ${question.text}`;
        questionDiv.appendChild(questionText);
        
        // Options container
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options';
        
        // Create radio buttons for each option
        question.options.forEach((option, optionIndex) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `question_${question.id}`;
            radio.value = optionIndex;
            radio.id = `q${question.id}_opt${optionIndex}`;
            
            // Store answer when selected
            radio.addEventListener('change', () => {
                studentAnswers[question.id] = optionIndex;
            });
            
            const label = document.createElement('label');
            label.htmlFor = `q${question.id}_opt${optionIndex}`;
            label.textContent = `${String.fromCharCode(65 + optionIndex)}. ${option}`; // A, B, C, D
            
            optionDiv.appendChild(radio);
            optionDiv.appendChild(label);
            optionsDiv.appendChild(optionDiv);
        });
        
        questionDiv.appendChild(optionsDiv);
        container.appendChild(questionDiv);
    });
}

// Handle form submission
document.getElementById('examForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check if all questions are answered
    if (Object.keys(studentAnswers).length < questions.length) {
        alert('Please answer all questions before submitting.');
        return;
    }
    
    // Confirm submission
    if (!confirm('Are you sure you want to submit your exam? You cannot change your answers after submission.')) {
        return;
    }
    
    try {
        // Submit answers to server
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers: studentAnswers })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit exam');
        }
        
        const result = await response.json();
        
        // Display results
        showResults(result);
        
    } catch (error) {
        console.error('Error submitting exam:', error);
        alert('Error submitting exam. Please try again.');
    }
});

// Display exam results
function showResults(result) {
    // Hide exam form
    document.getElementById('examForm').style.display = 'none';
    
    // Show results section
    const resultsSection = document.getElementById('results');
    resultsSection.style.display = 'block';
    
    // Populate results
    document.getElementById('totalQuestions').textContent = result.total;
    document.getElementById('correctAnswers').textContent = result.correct;
    document.getElementById('percentage').textContent = result.percentage + '%';
    
    // Display message with appropriate styling
    const messageDiv = document.getElementById('resultMessage');
    messageDiv.textContent = result.message;
    messageDiv.className = result.passed ? 'result-message pass' : 'result-message fail';
    
    // Scroll to top to show results
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
