// ===== Student Exam JavaScript =====

let questions = []; // Store all questions
let studentAnswers = {}; // Store student's answers
let studentName = ''; // Store student name

// Start exam after entering name
function startExam() {
    const nameInput = document.getElementById('studentName');
    studentName = nameInput.value.trim();
    
    if (!studentName) {
        alert('Please enter your name to start the exam.');
        return;
    }
    
    // Hide name section and show loading
    document.getElementById('nameSection').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    
    // Load questions
    loadQuestions();
}

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
            body: JSON.stringify({ 
                studentName: studentName,
                answers: studentAnswers 
            })
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
    document.getElementById('studentNameDisplay').textContent = studentName;
    document.getElementById('totalQuestions').textContent = result.total;
    document.getElementById('correctAnswers').textContent = result.correct;
    document.getElementById('percentage').textContent = result.percentage + '%';
    
    // Display message with appropriate styling
    const messageDiv = document.getElementById('resultMessage');
    messageDiv.textContent = result.message;
    messageDiv.className = result.passed ? 'result-message pass' : 'result-message fail';
    
    // Display detailed results
    showDetailedResults(result.detailedResults);
    
    // Scroll to top to show results
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show detailed question-by-question results
function showDetailedResults(detailedResults) {
    const container = document.getElementById('detailedResultsContainer');
    container.innerHTML = '';
    
    detailedResults.forEach((result, index) => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'question-item';
        
        // Question text
        const questionText = document.createElement('div');
        questionText.className = 'question-item-text';
        questionText.innerHTML = `${index + 1}. ${result.questionText} ${result.isCorrect ? '<span style="color: #4CAF50; font-weight: bold;">✓ Correct</span>' : '<span style="color: #f44336; font-weight: bold;">✗ Wrong</span>'}`;
        resultDiv.appendChild(questionText);
        
        // Options with highlighting
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'question-item-options';
        
        result.options.forEach((option, optionIndex) => {
            const optionP = document.createElement('div');
            const letter = String.fromCharCode(65 + optionIndex);
            
            let optionHTML = `${letter}. ${option}`;
            
            // Highlight student's answer
            if (optionIndex === result.studentAnswer) {
                if (result.isCorrect) {
                    optionHTML += ' <span style="color: #4CAF50; font-weight: bold;">← Your answer (Correct!)</span>';
                } else {
                    optionHTML += ' <span style="color: #f44336; font-weight: bold;">← Your answer (Wrong)</span>';
                }
            }
            
            // Show correct answer if student was wrong
            if (!result.isCorrect && optionIndex === result.correctAnswer) {
                optionHTML += ' <span style="color: #4CAF50; font-weight: bold;">← Correct Answer</span>';
            }
            
            optionP.innerHTML = optionHTML;
            optionP.style.padding = '8px';
            
            // Background color for correct/wrong answers
            if (optionIndex === result.studentAnswer && !result.isCorrect) {
                optionP.style.backgroundColor = '#ffebee';
            } else if (optionIndex === result.correctAnswer) {
                optionP.style.backgroundColor = '#e8f5e9';
            }
            
            optionsDiv.appendChild(optionP);
        });
        
        resultDiv.appendChild(optionsDiv);
        container.appendChild(resultDiv);
    });
}
