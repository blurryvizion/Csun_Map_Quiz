// ====================================
// CSUN Campus Map Quiz - JavaScript
// ====================================

// Game State Variables
let map;
let currentQuestionIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let gameActive = false;
let timerInterval;
let elapsedSeconds = 0;
let rectangles = [];
let highScores = [];

// CSUN Campus Center Coordinates
const CSUN_CENTER = { lat: 34.2407, lng: -118.5291 };

// Location Data - Building coordinates and boundaries
// Each location has a center point and a bounding box for answer checking
const locations = [
    {
        name: "BookStore",
        prompt: "Where is the BookStore??",
        // CSC - Campus Store Complex — Grid E2 (south side of campus, near Nordhoff St)
        center: { lat: 34.2365, lng: -118.5282 },
        bounds: {
            north: 34.2375,
            south: 34.2355,
            east: -118.5262,
            west: -118.5302
        }
    },
    {
        name: "Bayramian Hall",
        prompt: "Where is Bayramian Hall",
        // BH - Bayramian Hall — Grid C4 (west side, near University Hall)
        center: { lat: 34.2400, lng: -118.5365 },
        bounds: {
            north: 34.2415,
            south: 34.2385,
            east: -118.5345,
            west: -118.5385
        }
    },
    {
        name: "Jacaranda Hall",
        prompt: "Where is Jacaranda Hall",
        // JD - Jacaranda Hall — Grid E5 (center-east, near Spirit Plaza)
        center: { lat: 34.2408, lng: -118.5290 },
        bounds: {
            north: 34.2420,
            south: 34.2396,
            east: -118.5270,
            west: -118.5310
        }
    },
    {
        name: "Manzanita Hall",
        prompt: "Where is Manzanita Hall",
        // MZ - Manzanita Hall — Grid D2 (south-center, near Mike Curb College Arts Walk)
        center: { lat: 34.2370, lng: -118.5320 },
        bounds: {
            north: 34.2382,
            south: 34.2358,
            east: -118.5300,
            west: -118.5340
        }
    },
    {
        name: "Citrus Hall",
        prompt: "Where is Citrus Hall",
        // CS - Citrus Hall — Grid E3 (near Eucalyptus Hall and Live Oak Hall)
        center: { lat: 34.2385, lng: -118.5282 },
        bounds: {
            north: 34.2397,
            south: 34.2373,
            east: -118.5262,
            west: -118.5302
        }
    }
];

/**
 * Initialize Google Map
 */
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: CSUN_CENTER,
        zoom: 16,
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        draggable: false,
        zoomControl: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        gestureHandling: 'none',
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            },
            {
                featureType: "transit",
                stylers: [{ visibility: "off" }]
            }
        ]
    });

    map.addListener('dblclick', handleMapDoubleClick);
}

/**
 * Start the game
 */
function startGame() {
    document.getElementById('instructionsOverlay').style.display = 'none';
    gameActive = true;
    elapsedSeconds = 0;
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    rectangles = [];
    
    document.getElementById('questionsList').innerHTML = '';
    document.getElementById('finalScore').style.display = 'none';
    
    startTimer();
    showQuestion(0);
}

/**
 * Start the elapsed time timer
 */
function startTimer() {
    timerInterval = setInterval(() => {
        elapsedSeconds++;
        updateTimerDisplay();
    }, 1000);
}

/**
 * Update the timer display
 */
function updateTimerDisplay() {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Display a question in the sidebar
 */
function showQuestion(index) {
    const location = locations[index];
    const questionsList = document.getElementById('questionsList');
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.id = `question-${index}`;
    questionDiv.style.animationDelay = `${index * 0.1}s`;
    
    questionDiv.innerHTML = `
        <div class="question-prompt active" id="prompt-${index}">${location.prompt}</div>
        <div class="question-result" id="result-${index}"></div>
    `;
    
    questionsList.appendChild(questionDiv);
    
    document.getElementById('mapContainer').classList.add('pulse');
    setTimeout(() => {
        document.getElementById('mapContainer').classList.remove('pulse');
    }, 1000);
}

/**
 * Handle double-click on the map
 */
function handleMapDoubleClick(event) {
    if (!gameActive) return;
    
    const clickLat = event.latLng.lat();
    const clickLng = event.latLng.lng();
    const currentLocation = locations[currentQuestionIndex];
    
    const isCorrect = isWithinBounds(clickLat, clickLng, currentLocation.bounds);
    
    drawRectangle(currentLocation.bounds, isCorrect);
    updateQuestionResult(currentQuestionIndex, isCorrect);
    showFeedback(isCorrect, currentLocation.name);
    
    if (isCorrect) {
        correctCount++;
    } else {
        incorrectCount++;
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex < locations.length) {
        setTimeout(() => {
            showQuestion(currentQuestionIndex);
        }, 1500);
    } else {
        setTimeout(() => {
            endGame();
        }, 1500);
    }
}

/**
 * Check if coordinates are within given bounds
 */
function isWithinBounds(lat, lng, bounds) {
    return lat <= bounds.north && 
           lat >= bounds.south && 
           lng <= bounds.east && 
           lng >= bounds.west;
}

/**
 * Draw a rectangle on the map
 */
function drawRectangle(bounds, isCorrect) {
    const rectangle = new google.maps.Rectangle({
        strokeColor: isCorrect ? '#4CAF50' : '#F44336',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        fillColor: isCorrect ? '#4CAF50' : '#F44336',
        fillOpacity: 0.4,
        map: map,
        bounds: {
            north: bounds.north,
            south: bounds.south,
            east: bounds.east,
            west: bounds.west
        }
    });
    
    rectangles.push(rectangle);
}

/**
 * Update the question result text
 */
function updateQuestionResult(index, isCorrect) {
    const resultDiv = document.getElementById(`result-${index}`);
    const promptDiv = document.getElementById(`prompt-${index}`);
    
    promptDiv.classList.remove('active');
    
    if (isCorrect) {
        resultDiv.textContent = 'Your answer is correct!!';
        resultDiv.className = 'question-result correct';
    } else {
        resultDiv.textContent = 'Sorry wrong location.';
        resultDiv.className = 'question-result incorrect';
    }
}

/**
 * Show feedback toast
 */
function showFeedback(isCorrect, locationName) {
    const toast = document.getElementById('feedbackToast');
    const title = document.getElementById('feedbackTitle');
    const message = document.getElementById('feedbackMessage');
    
    toast.className = 'feedback-toast ' + (isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
        title.textContent = '✓ Correct!';
        message.textContent = `Great job finding ${locationName}!`;
    } else {
        title.textContent = '✗ Incorrect';
        message.textContent = `That's not ${locationName}. The correct location is shown on the map.`;
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 1200);
}

/**
 * End the game and show final score
 */
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    
    if (correctCount === locations.length) {
        saveHighScore(elapsedSeconds);
        createConfetti();
    }
    
    const scoreText = document.getElementById('scoreText');
    const statsText = document.getElementById('statsText');
    
    scoreText.textContent = `${correctCount} Correct, ${incorrectCount} Incorrect`;
    
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    statsText.textContent = `Completed in ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    displayHighScores();
    
    document.getElementById('finalScore').style.display = 'block';
}

/**
 * Save a high score to local storage
 */
function saveHighScore(time) {
    const scores = JSON.parse(localStorage.getItem('csunMapQuizScores') || '[]');
    
    scores.push({
        time: time,
        date: new Date().toLocaleDateString()
    });
    
    scores.sort((a, b) => a.time - b.time);
    scores.splice(5);
    
    localStorage.setItem('csunMapQuizScores', JSON.stringify(scores));
}

/**
 * Display high scores
 */
function displayHighScores() {
    const scores = JSON.parse(localStorage.getItem('csunMapQuizScores') || '[]');
    const list = document.getElementById('highScoresList');
    
    if (scores.length === 0) {
        list.innerHTML = '<li style="color: #888; font-style: italic;">Get all 5 correct to set a score!</li>';
        return;
    }
    
    list.innerHTML = '';
    scores.forEach((score, index) => {
        const minutes = Math.floor(score.time / 60);
        const seconds = score.time % 60;
        const li = document.createElement('li');
        li.innerHTML = `
            <span>#${index + 1} - ${minutes}:${seconds.toString().padStart(2, '0')}</span>
            <span>${score.date}</span>
        `;
        list.appendChild(li);
    });
}

/**
 * Create confetti animation
 */
function createConfetti() {
    const colors = ['#cf0a2c', '#4CAF50', '#FFD700', '#2196F3', '#9C27B0'];
    
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.width = (Math.random() * 10 + 5) + 'px';
            confetti.style.height = (Math.random() * 10 + 5) + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            
            document.body.appendChild(confetti);
            
            const duration = Math.random() * 3 + 2;
            confetti.animate([
                { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
                { transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
            ], {
                duration: duration * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => confetti.remove();
        }, i * 30);
    }
}

/**
 * Restart the game
 */
function restartGame() {
    rectangles.forEach(rect => rect.setMap(null));
    rectangles = [];
    
    document.getElementById('timer').textContent = '00:00';
    
    startGame();
}

// Initialize game when window loads
window.onload = function() {
    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
        initMap();
    }
};