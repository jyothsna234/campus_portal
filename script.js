
function showPage(page) {
    const title = document.getElementById("page-title");
    const content = document.getElementById("page-content");

    const pages = {
        home: {
            title: "Welcome to Campus Portal",
            text: "<h2>Hello, Student!</h2><p>Check your attendance, courses and upcoming events on the homepage.</p>"
        },
        profile: {
            title: "My Profile",
            text: "<div class='section-card'><h2>Student Details</h2><p>Name: Demo Student</p><p>Department: Computer Science</p><p>Campus: Main Campus</p></div>"
        },
        academics: {
            title: "Academics",
            text: "<div class='section-card'><h2>My Courses</h2><p>Database Management Systems — 88%</p><p>Design and Analysis of Algorithms — 82%</p><p>Java Programming — 91%</p></div>"
        },
        hostel: {
            title: "Hostel",
            text: "<div class='section-card'><h2>Hostel Information</h2><p>Room: Demo Room 204</p><p>For hostel assistance, contact the hostel office.</p></div>"
        },
        payment: {
            title: "Payments",
            text: "<div class='section-card'><h2>Fee Information</h2><p>Pending amount: ₹0</p><p>This is sample information, not a real payment record.</p></div>"
        }
    };

    title.textContent = pages[page].title;
    content.innerHTML = pages[page].text;
}

function readPage() {
    if (!("speechSynthesis" in window)) {
        alert("Speech output is not supported by this browser.");
        return;
    }

    window.speechSynthesis.cancel();

    const text = document.getElementById("page-title").textContent
        + ". "
        + document.getElementById("page-content").innerText;

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    window.speechSynthesis.speak(speech);
}


async function askGemini(question) {
    const responseBox = document.getElementById("assistant-response");

    responseBox.textContent = "Thinking...";

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: question
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Request failed");
        }

        const answer = data.reply;

const q = question.toLowerCase();

if (q.includes("open") || q.includes("go to") || q.includes("take me")) {
    if (q.includes("profile")) {
        showPage("profile");
    } else if (q.includes("academic") || q.includes("course")) {
        showPage("academics");
    } else if (q.includes("hostel")) {
        showPage("hostel");
    } else if (q.includes("payment") || q.includes("fee")) {
        showPage("payment");
    } else if (q.includes("home")) {
        showPage("home");
    }
}

        responseBox.textContent = "You asked: " + question + "\n" + answer;

        window.speechSynthesis.cancel();

        const speech = new SpeechSynthesisUtterance(answer);
        speech.lang = "en-IN";
        window.speechSynthesis.speak(speech);

    } catch (error) {
        console.error(error);
        responseBox.textContent =
            "Sorry, I couldn't connect to the AI assistant. Please try again.";
    }
}

function startListening() {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        document.getElementById("assistant-response").textContent =
            "Voice input is not supported here. Try Chrome.";
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;

    document.getElementById("assistant-response").textContent =
        "Listening... Please speak now.";

    
recognition.onresult = function (event) {
    const question = event.results[0][0].transcript.toLowerCase();
    const responseBox = document.getElementById("assistant-response");
    
    if (question.includes("stop reading") || question.includes("stop speaking")) {
    window.speechSynthesis.cancel();
    responseBox.textContent = "Speech stopped.";
    } else if (question.includes("repeat that") || question.includes("repeat")) {
    readPage();
    responseBox.textContent = "Repeating the current page.";
    } else if (question.includes("profile")) {
    showPage("profile");
    responseBox.textContent = "Opening your profile.";
    speakAnswer("Opening your profile.");
    }
    else if (question.includes("academic") || question.includes("course")) {
        showPage("academics");
        responseBox.textContent = "Opening academics.";
        speakAnswer("Opening academics.");
    } else if (question.includes("hostel")) {
        showPage("hostel");
        responseBox.textContent = "Opening hostel information.";
        speakAnswer("Opening hostel information.");
    } else if (question.includes("payment") || question.includes("fee")) {
        showPage("payment");
        responseBox.textContent = "Opening payments.";
        speakAnswer("Opening payments.");
    } else if (question.includes("home")) {
        showPage("home");
        responseBox.textContent = "Opening the homepage.";
        speakAnswer("Opening the homepage.");
    
    } else if (
    question.includes("read this page") ||
    question.includes("read the page") ||
    question.includes("read current page")
    ) {
    readPage();
    responseBox.textContent = "Reading the current page.";

    } else if (question.includes("attendance")) {
        responseBox.textContent = "Your overall sample attendance is 85 percent.";
        speakAnswer("Your overall sample attendance is 85 percent.");
    } else {
        askGemini(question);
    }
};

function speakAnswer(answer) {
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(answer);
    speech.lang = "en-IN";
    window.speechSynthesis.speak(speech);
}


    recognition.onerror = function () {
        document.getElementById("assistant-response").textContent =
            "I couldn't hear you. Check microphone permission and try again.";
    };

    recognition.start();
}
