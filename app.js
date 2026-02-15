let sessionTime = 0;
let totalTime = 0;
let timerInterval;

let switchCount = 0;
let distractionStart = null;
let totalDistractionTime = 0;
let microChecks = 0;

let isSessionActive = false;

// ================= AUTH =================

function register() {
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;

    if (!user || !pass) {
        alert("Fill all fields");
        return;
    }

    localStorage.setItem("user", user);
    localStorage.setItem("pass", pass);
    alert("Account Created!");
}

function login() {
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;

    if (
        user === localStorage.getItem("user") &&
        pass === localStorage.getItem("pass")
    ) {
        document.getElementById("authScreen").classList.add("hidden");
        document.getElementById("taskScreen").classList.remove("hidden");
    } else {
        alert("Invalid login");
    }
}

function logout() {
    location.reload();
}

// ================= TASK START =================

function startFocus() {
    let taskName = document.getElementById("taskName").value;
    let taskMinutes = document.getElementById("taskTime").value;

    if (!taskName || !taskMinutes) {
        alert("Enter task details");
        return;
    }

    totalTime = taskMinutes * 60;
    sessionTime = totalTime;

    switchCount = 0;
    totalDistractionTime = 0;
    microChecks = 0;
    distractionStart = null;

    isSessionActive = true;

    document.getElementById("focusTaskTitle").innerText = taskName;

    document.getElementById("taskScreen").classList.add("hidden");
    document.getElementById("focusScreen").classList.remove("hidden");

    updateTimerDisplay();
    startTimer();
}

// ================= TIMER =================

function startTimer() {
    timerInterval = setInterval(() => {

        sessionTime--;
        updateTimerDisplay();

        if (sessionTime <= 0) {
            clearInterval(timerInterval);
            endSession();
        }

    }, 1000);
}

function updateTimerDisplay() {
    let mins = Math.floor(sessionTime / 60);
    let secs = sessionTime % 60;

    document.getElementById("timer").innerText =
        `${mins}:${secs < 10 ? "0" : ""}${secs}`;

    // Progress bar update
    let progressPercent = ((totalTime - sessionTime) / totalTime) * 100;
    document.getElementById("progressFill").style.width =
        progressPercent + "%";
}

// ================= DISTRACTION TRACKING =================

document.addEventListener("visibilitychange", () => {

    if (!isSessionActive) return;

    if (document.hidden) {
        switchCount++;
        distractionStart = Date.now();
    } else {
        if (distractionStart) {
            let duration = (Date.now() - distractionStart) / 1000;
            totalDistractionTime += duration;

            if (duration < 20) {
                microChecks++;
            }

            distractionStart = null;
        }
    }
});

// ================= STOP / END =================

function stopSession() {
    clearInterval(timerInterval);
    endSession();
}

function endSession() {

    isSessionActive = false;

    document.getElementById("focusScreen").classList.add("hidden");
    document.getElementById("reportScreen").classList.remove("hidden");

    let focusScore = calculateFocusScore();
    let insight = generateInsight(focusScore);

    let effectiveFocus = totalTime - totalDistractionTime;

    document.getElementById("reportContent").innerHTML = `
        <p><strong>Total Time:</strong> ${formatTime(totalTime)}</p>
        <p><strong>Total Distraction Time:</strong> ${formatTime(Math.floor(totalDistractionTime))}</p>
        <p><strong>Tab Switches:</strong> ${switchCount}</p>
        <p><strong>Micro-Checks (&lt;20s):</strong> ${microChecks}</p>
        <p><strong>Effective Focus Time:</strong> ${formatTime(Math.floor(effectiveFocus))}</p>
        <h3>Focus Score: ${focusScore}%</h3>
        <p><strong>Insight:</strong> ${insight}</p>
    `;
}

// ================= FOCUS SCORE =================

function calculateFocusScore() {

    let effectiveFocus = totalTime - totalDistractionTime;

    let baseScore = (effectiveFocus / totalTime) * 100;

    let switchPenalty = switchCount * 2;
    let microPenalty = microChecks * 1;

    let finalScore = baseScore - switchPenalty - microPenalty;

    if (finalScore < 0) finalScore = 0;
    if (finalScore > 100) finalScore = 100;

    return finalScore.toFixed(1);
}

// ================= INSIGHT GENERATOR =================

function generateInsight(score) {

    if (score >= 90)
        return "Excellent Deep Work! You maintained elite focus.";
    else if (score >= 75)
        return "Strong focus session. Minor distractions detected.";
    else if (score >= 50)
        return "Moderate focus. Try reducing tab switching.";
    else
        return "High distraction level. Consider shorter sessions.";
}

// ================= UTIL =================

function formatTime(seconds) {
    let mins = Math.floor(seconds / 60);
    let secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

function newSession() {

    document.getElementById("reportScreen").classList.add("hidden");
    document.getElementById("taskScreen").classList.remove("hidden");

    document.getElementById("progressFill").style.width = "0%";
}
