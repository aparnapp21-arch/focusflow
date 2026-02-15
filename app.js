let totalTime = 0; // seconds
let sessionStartTime = 0;
let sessionEndTime = 0;
let timerInterval;

let switchCount = 0;
let distractionStart = null;
let totalDistractionTime = 0; // milliseconds
let microChecks = 0;

let isSessionActive = false;

/* ================= AUTH ================= */

function register() {
    let user = document.getElementById("username").value.trim();
    let pass = document.getElementById("password").value.trim();

    if (!user || !pass) {
        alert("Fill all fields");
        return;
    }

    localStorage.setItem("user", user);
    localStorage.setItem("pass", pass);
    alert("Account Created!");
}

function login() {
    let user = document.getElementById("username").value.trim();
    let pass = document.getElementById("password").value.trim();

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

/* ================= TASK START ================= */

function startFocus() {

    let taskName = document.getElementById("taskName").value;
    let taskMinutes = parseInt(document.getElementById("taskTime").value);

    if (!taskName || !taskMinutes || taskMinutes <= 0) {
        alert("Enter valid task details");
        return;
    }

    totalTime = taskMinutes * 60;
    sessionStartTime = Date.now();
    sessionEndTime = sessionStartTime + (totalTime * 1000);

    switchCount = 0;
    totalDistractionTime = 0;
    microChecks = 0;
    distractionStart = null;

    isSessionActive = true;

    document.getElementById("focusTaskTitle").innerText = taskName;

    document.getElementById("taskScreen").classList.add("hidden");
    document.getElementById("focusScreen").classList.remove("hidden");

    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 500);
}

/* ================= TIMER ================= */

function updateTimerDisplay() {

    if (!isSessionActive) return;

    let now = Date.now();
    let remainingMs = sessionEndTime - now;

    if (remainingMs <= 0) {
        clearInterval(timerInterval);
        endSession();
        return;
    }

    let remainingSec = Math.floor(remainingMs / 1000);

    let mins = Math.floor(remainingSec / 60);
    let secs = remainingSec % 60;

    document.getElementById("timer").innerText =
        `${mins}:${secs < 10 ? "0" : ""}${secs}`;

    let progressPercent =
        ((totalTime - remainingSec) / totalTime) * 100;

    document.getElementById("progressFill").style.width =
        progressPercent + "%";
}

/* ================= DISTRACTION TRACKING ================= */

document.addEventListener("visibilitychange", () => {

    if (!isSessionActive) return;

    if (document.hidden) {

        switchCount++;
        distractionStart = Date.now();

    } else {

        if (distractionStart) {

            let duration = Date.now() - distractionStart;
            totalDistractionTime += duration;

            if (duration < 20000) {
                microChecks++;
            }

            distractionStart = null;
        }
    }
});

/* ================= STOP / END ================= */

function stopSession() {
    clearInterval(timerInterval);
    endSession();
}

function endSession() {

    isSessionActive = false;

    if (distractionStart) {
        let duration = Date.now() - distractionStart;
        totalDistractionTime += duration;

        if (duration < 20000) {
            microChecks++;
        }

        distractionStart = null;
    }

    let distractionSeconds = Math.floor(totalDistractionTime / 1000);

    if (distractionSeconds > totalTime) {
        distractionSeconds = totalTime;
    }

    let effectiveFocus = totalTime - distractionSeconds;

    let focusScore = calculateFocusScore(distractionSeconds);
    let insight = generateInsight(focusScore);

    /* ===== SAVE SESSION ===== */

    let sessionData = {
        date: new Date().toLocaleString(),
        totalTime: totalTime,
        distractionTime: distractionSeconds,
        effectiveFocus: effectiveFocus,
        switchCount: switchCount,
        microChecks: microChecks,
        focusScore: parseFloat(focusScore)
    };

    saveSession(sessionData);

    /* ===== COMPARISON ===== */

    let previous = getPreviousSession();
    let comparisonText = "";

    if (previous) {

        let scoreDiff = sessionData.focusScore - previous.focusScore;

        if (scoreDiff > 0) {
            comparisonText =
                `Improved by ${scoreDiff.toFixed(1)}% from last session.`;
        } else if (scoreDiff < 0) {
            comparisonText =
                `Dropped by ${Math.abs(scoreDiff).toFixed(1)}% from last session.`;
        } else {
            comparisonText = `Same performance as last session.`;
        }

    } else {
        comparisonText = "This is your first recorded session.";
    }

    document.getElementById("focusScreen").classList.add("hidden");
    document.getElementById("reportScreen").classList.remove("hidden");

    document.getElementById("reportContent").innerHTML = `
        <p><strong>Total Time:</strong> ${formatTime(totalTime)}</p>
        <p><strong>Total Distraction Time:</strong> ${formatTime(distractionSeconds)}</p>
        <p><strong>Tab Switches:</strong> ${switchCount}</p>
        <p><strong>Micro-Checks (&lt;20s):</strong> ${microChecks}</p>
        <p><strong>Effective Focus Time:</strong> ${formatTime(effectiveFocus)}</p>
        <h3>Focus Score: ${focusScore}%</h3>
        <p><strong>Insight:</strong> ${insight}</p>
        <p><strong>Comparison:</strong> ${comparisonText}</p>
    `;
}

/* ================= SESSION STORAGE ================= */

function saveSession(data) {

    let sessions = JSON.parse(localStorage.getItem("sessions")) || [];

    sessions.push(data);

    localStorage.setItem("sessions", JSON.stringify(sessions));
}

function getPreviousSession() {

    let sessions = JSON.parse(localStorage.getItem("sessions")) || [];

    if (sessions.length < 2) return null;

    return sessions[sessions.length - 2];
}

/* ================= FOCUS SCORE ================= */

function calculateFocusScore(distractionSeconds) {

    let effectiveFocus = totalTime - distractionSeconds;

    let baseScore = (effectiveFocus / totalTime) * 100;

    let switchPenalty = switchCount * 2;
    let microPenalty = microChecks * 1;

    let finalScore = baseScore - switchPenalty - microPenalty;

    if (finalScore < 0) finalScore = 0;
    if (finalScore > 100) finalScore = 100;

    return finalScore.toFixed(1);
}

/* ================= INSIGHT ================= */

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

/* ================= UTIL ================= */

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
