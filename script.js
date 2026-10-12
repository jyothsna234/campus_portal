
let lastAnswer = "";

const pages = {
    home: {
        title: "Welcome to Campus Portal",
        content: `
            <div class="welcome-card">
                <h2>Hello, Student! 👋</h2>
                <p>Here is your academic overview.</p>
            </div>
            <div class="cards">
                <div class="card">
                    <h3>Overall Attendance</h3>
                    <p class="number">85%</p>
                </div>
                <div class="card">
                    <h3>Enrolled Courses</h3>
                    <p class="number">6</p>
                </div>
                <div class="card">
                    <h3>Pending Payments</h3>
                    <p class="number">₹20,000</p>
                </div>
            </div>
            <div class="section-card">
                <h2>Upcoming Events</h2>
                <p>Department Technical Symposium</p>
                <p>Semester Examination Registration</p>
                <p>Campus Coding Competition</p>
            </div>
        `
    },

    profile: {
        title: "My Profile",
        content: `
            <div class="section-card">
                <h2>Student Details</h2>
                <p>Name: Demo Student</p>
                <p>Department: Computer Science</p>
                <p>Campus: Main Campus</p>
                <p>Student ID: DEMO001</p>
            </div>
        `
    },

    academics: {
        title: "Academics",
        content: `
            <div class="section-card">
                <h2>My Courses</h2>
                <p>Ask the assistant to view marks and attendance
                retrieved from the sample database.</p>
            </div>
        `
    },

    hostel: {
        title: "Hostel",
        content: `
            <div class="section-card">
                <h2>Hostel Information</h2>
                <p>Room: Demo Room 204</p>
                <p>Hostel status: Allocated</p>
                <p>For hostel assistance, contact the hostel office.</p>
                <p>This is sample information.</p>
            </div>
        `
    },

    payment: {
        title: "Payments",
        content: `
            <div class="section-card">
                <h2>Fee Information</h2>
                <p>Fee details are retrieved from the sample database.</p>
            </div>
        `
    }
};

function showPage(page) {
    if (!pages[page]) return;

    document.getElementById("page-title").textContent =
        pages[page].title;

    document.getElementById("page-content").innerHTML =
        pages[page].content;
}

function speakAnswer(answer) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(answer);
    speech.lang = "en-IN";

    window.speechSynthesis.speak(speech);
}

function stopSpeaking() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}

function readPage() {
    const title = document.getElementById("page-title").textContent;
    const content = document.getElementById("page-content").innerText;
    const answer = title + ". " + content;

    lastAnswer = answer;
    speakAnswer(answer);
}

function showAnswer(answer, shouldSpeak = true) {
    document.getElementById("assistant-response").textContent = answer;
    lastAnswer = answer;

    if (shouldSpeak) {
        speakAnswer(answer);
    }
}

async function inspectWebsite(url) {
    try {
        const response = await fetch("/api/inspect", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Website inspection failed");
        }

        const summary =
            `Website: ${data.title}. ` +
            `Headings: ${(data.headings || []).join(", ") || "None found"}. ` +
            `Links: ${(data.links || []).map(link => link.text).join(", ") || "None found"}. ` +
            `Buttons: ${(data.buttons || []).join(", ") || "None found"}.`;

        showAnswer(summary);
    } catch (error) {
        console.error(error);
        showAnswer("Sorry, I couldn't inspect that website.", false);
    }
}

function identifyCourse(q) {
    if (q.includes("dbms") || q.includes("database")) {
        return "Database Management Systems";
    }

    if (q.includes("java")) {
        return "Java Programming";
    }

    if (
        q.includes("algorithm") ||
        q.includes("daa")
    ) {
        return "Design and Analysis of Algorithms";
    }

    if (
        q.includes("computer organization") ||
        q.includes("coa")
    ) {
        return "Computer Organization";
    }

    if (q.includes("discrete")) {
        return "Discrete Mathematics";
    }

    if (q.includes("data structures") || q.includes("data structure")) {
        return "Data Structures";
    }

    return "";
}

async function getCourses() {
    const response = await fetch("/api/courses");
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Could not load courses");
    }

    return data.courses || [];
}

async function askGemini(question) {
    const responseBox = document.getElementById("assistant-response");
    const q = question.toLowerCase().trim();

    responseBox.textContent = "Thinking...";

    try {
        // Navigation requests
        if (
            q.includes("open") ||
            q.includes("go to") ||
            q.includes("take me to") ||
            q.includes("show me") ||
            q.includes("navigate to")
        ) {
            if (q.includes("profile")) {
                showPage("profile");
                showAnswer("Opening your profile.");
                return;
            }

            if (q.includes("academic") || q.includes("course")) {
                showPage("academics");
                showAnswer("Opening academics.");
                return;
            }

            if (q.includes("hostel") || q.includes("room")) {
                showPage("hostel");
                showAnswer("Opening hostel information.");
                return;
            }

            if (q.includes("payment") || q.includes("fee")) {
                showPage("payment");
                showAnswer("Opening payments.");
                return;
            }

            if (q.includes("home")) {
                showPage("home");
                showAnswer("Opening the homepage.");
                return;
            }
        }

        // Highest or lowest marks
        const asksHighest =
            q.includes("highest") ||
            q.includes("top scoring") ||
            q.includes("best performing") ||
            q.includes("best marks") ||
            q.includes("best score") ||
            q.includes("highest grade");

        const asksLowest =
            q.includes("lowest") ||
            q.includes("worst marks") ||
            q.includes("worst score") ||
            q.includes("lowest grade");

        if (asksHighest || asksLowest) {
            const courses = await getCourses();

            if (courses.length === 0) {
                showAnswer("No course records were found.");
                return;
            }

            courses.sort((a, b) => {
                const percentageA = Number(a.total_marks)
                    ? Number(a.marks_obtained) / Number(a.total_marks)
                    : 0;

                const percentageB = Number(b.total_marks)
                    ? Number(b.marks_obtained) / Number(b.total_marks)
                    : 0;

                return asksLowest
                    ? percentageA - percentageB
                    : percentageB - percentageA;
            });

            const course = courses[0];
            const percentage = Number(course.total_marks)
                ? (Number(course.marks_obtained) /
                   Number(course.total_marks)) * 100
                : 0;

            showPage("academics");

            showAnswer(
                `${asksLowest ? "Your lowest-scoring course is" :
                "Your highest-scoring course is"} ${course.course_name}, ` +
                `with ${course.marks_obtained} out of ${course.total_marks} marks ` +
                `(${percentage.toFixed(2)}%).`
            );
            return;
        }

        // List all courses
        if (
            q.includes("all courses") ||
            q.includes("list courses") ||
            q.includes("all subjects") ||
            q.includes("my subjects") ||
            q.includes("compare my subjects")
        ) {
            const courses = await getCourses();

            const answer = courses.map(course => {
                const percentage = Number(course.total_marks)
                    ? (Number(course.marks_obtained) /
                       Number(course.total_marks)) * 100
                    : 0;

                const attendance = Number(course.total_classes)
                    ? (Number(course.classes_attended) /
                       Number(course.total_classes)) * 100
                    : 0;

                return `${course.course_name}: ${course.marks_obtained}/` +
                    `${course.total_marks} marks (${percentage.toFixed(2)}%), ` +
                    `attendance ${attendance.toFixed(2)}%.`;
            }).join("\n");

            showPage("academics");
            showAnswer(answer || "No courses were found.");
            return;
        }

        // Individual course marks
        if (
            q.includes("mark") ||
            q.includes("score") ||
            q.includes("grade")
        ) {
            const course = identifyCourse(q);

            if (course) {
                const response = await fetch(
                    "/api/marks?course=" + encodeURIComponent(course)
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Marks unavailable");
                }

                const record = data.course;
                const percentage = Number(record.total_marks)
                    ? (Number(record.marks_obtained) /
                       Number(record.total_marks)) * 100
                    : 0;

                showPage("academics");

                showAnswer(
                    `Your ${record.course_name} marks are ` +
                    `${record.marks_obtained} out of ${record.total_marks}, ` +
                    `which is ${percentage.toFixed(2)}%.`
                );
                return;
            }
        }

        // Attendance
        if (
            q.includes("attendance") ||
            q.includes("classes attended") ||
            q.includes("bunk")
        ) {
            const course = identifyCourse(q);

            if (course) {
                const response = await fetch(
                    "/api/attendance?course=" + encodeURIComponent(course)
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Attendance unavailable");
                }

                showPage("academics");

                showAnswer(
                    `Your ${data.course} attendance is ` +
                    `${data.attendancePercentage}%. You attended ` +
                    `${data.classesAttended} out of ${data.totalClasses} classes.`
                );
                return;
            }

            const courses = await getCourses();

            const totalAttended = courses.reduce(
                (sum, course) => sum + Number(course.classes_attended), 0
            );

            const totalClasses = courses.reduce(
                (sum, course) => sum + Number(course.total_classes), 0
            );

            const percentage = totalClasses
                ? (totalAttended / totalClasses) * 100
                : 0;

            showAnswer(
                `Your combined sample attendance is ${percentage.toFixed(2)}%, ` +
                `based on ${totalAttended} attended classes out of ${totalClasses}.`
            );
            return;
        }

        // Fee information
        if (
            q.includes("fee") ||
            q.includes("payment") ||
            q.includes("paid") ||
            q.includes("pending amount") ||
            q.includes("owe")
        ) {
            const response = await fetch("/api/fees");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Fees unavailable");
            }

            showPage("payment");

            showAnswer(
                `Your total sample fee is ₹${data.totalFee}. ` +
                `You have paid ₹${data.amountPaid}, and ` +
                `₹${data.pendingAmount} is pending.`
            );
            return;
        }

        // Hostel data is currently hard-coded, not stored in SQLite
        if (q.includes("hostel") || q.includes("room number")) {
            showPage("hostel");

            showAnswer(
                "Your sample hostel room is Demo Room 204, " +
                "and your hostel status is allocated. " +
                "These are demonstration details."
            );
            return;
        }

        // Let the backend and local AI handle other questions
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: question })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "AI request failed");
        }

        showAnswer(data.reply || "I couldn't generate an answer.");

    } catch (error) {
        console.error(error);

        showAnswer(
            "Sorry, I couldn't retrieve that information. Please try again.",
            false
        );
    }
}

function startListening() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        showAnswer(
            "Voice input is not supported in this browser. Try Google Chrome.",
            false
        );
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    document.getElementById("assistant-response").textContent =
        "Listening... Please speak now.";

    recognition.onresult = function (event) {
        const question = event.results[0][0].transcript;

        document.getElementById("assistant-input").value = question;
        askGemini(question);
    };

    recognition.onerror = function () {
        showAnswer(
            "I couldn't hear you. Check microphone permission and try again.",
            false
        );
    };

    recognition.start();
}

// Typed questions use the same assistant
document.getElementById("assistant-form").addEventListener(
    "submit",
    function (event) {
        event.preventDefault();

        const input = document.getElementById("assistant-input");
        const question = input.value.trim();

        if (!question) return;

        input.value = "";
        askGemini(question);
    }
);
