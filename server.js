


const express = require("express");
const path = require("path");
const db = require("./database");
const { inspectWebsite } = require("./browser");

const app = express();

app.use(express.json());
app.use(express.static(__dirname, {
    dotfiles: "deny"
}));

// Ask the local AI to explain retrieved results
async function askAI(question, data) {
    const response = await fetch(
        "http://localhost:11434/api/chat",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen2.5:3b",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a friendly college portal assistant. " +
                            "Use the supplied portal data to answer the user. " +
                            "Never claim you cannot access the database when " +
                            "data is provided. Never invent student records. " +
                            "Answer clearly and concisely. Data may be null " +
                            "if a requested record was not found."
                    },
                    {
                        role: "user",
                        content:
                            "Question: " + question +
                            "\nPortal data: " + JSON.stringify(data)
                    }
                ],
                stream: false
            })
        }
    );

    if (!response.ok) {
        throw new Error("Ollama request failed");
    }

    const result = await response.json();
    return result.message?.content || "I couldn't generate an answer.";
}

// Retrieve the course list from the database
function getCourses() {
    return db.prepare(`
        SELECT
            course_name,
            marks_obtained,
            total_marks,
            classes_attended,
            total_classes
        FROM courses
        WHERE student_id = ?
    `).all("DEMO001");
}

// Find the course that has the highest percentage
function getHighestCourse() {
    const courses = getCourses();

    if (courses.length === 0) {
        return null;
    }

    return courses.reduce((best, course) => {
        const score = course.total_marks > 0
            ? course.marks_obtained / course.total_marks
            : -1;

        const bestScore = best.total_marks > 0
            ? best.marks_obtained / best.total_marks
            : -1;

        return score > bestScore ? course : best;
    });
}

// Main AI assistant
app.post("/api/chat", async (req, res) => {
    try {
        const message = req.body.message;

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Please enter a question."
            });
        }

        const question = message.trim();
        const q = question.toLowerCase();

        let data;

        // Highest or lowest marks
        if (
            q.includes("highest marks") ||
            q.includes("highest score") ||
            q.includes("best marks") ||
            q.includes("top scoring") ||
            q.includes("lowest marks") ||
            q.includes("lowest score") ||
            q.includes("worst marks") ||
            q.includes("highest percentage") ||
            q.includes("lowest percentage")
        ) {
            const highest = q.includes("highest") ||
                q.includes("best") ||
                q.includes("top");

            const courses = getCourses();

            const ranked = courses
                .filter(course => course.total_marks > 0)
                .sort((a, b) => {
                    const scoreA =
                        a.marks_obtained / a.total_marks;
                    const scoreB =
                        b.marks_obtained / b.total_marks;

                    return highest
                        ? scoreB - scoreA
                        : scoreA - scoreB;
                });

            data = {
                result: ranked.length ? ranked[0] : null,
                allCourses: ranked
            };
        }

        // Course marks
        else if (
            q.includes("mark") ||
            q.includes("score") ||
            q.includes("grade")
        ) {
            const courses = getCourses();

            const course = courses.find(item => {
                const name = item.course_name.toLowerCase();

                return q.includes(name) ||
                    (name.includes("database") &&
                        (q.includes("dbms") || q.includes("database"))) ||
                    (name.includes("algorithms") &&
                        (q.includes("daa") || q.includes("algorithm"))) ||
                    (name.includes("java") && q.includes("java")) ||
                    (name.includes("computer organization") &&
                        (q.includes("coa") || q.includes("organization"))) ||
                    (name.includes("discrete") && q.includes("discrete")) ||
                    (name.includes("data structures") &&
                        q.includes("data structure"));
            });

            data = course
                ? { course }
                : { courses, note: "No single matching course was identified." };
        }

        // Attendance
        else if (
            q.includes("attendance") ||
            q.includes("classes attended") ||
            q.includes("bunk")
        ) {
            const courses = getCourses();

            const course = courses.find(item => {
                const name = item.course_name.toLowerCase();

                return q.includes(name) ||
                    (name.includes("database") && q.includes("dbms")) ||
                    (name.includes("algorithms") && q.includes("daa")) ||
                    (name.includes("computer organization") && q.includes("coa")) ||
                    (name.includes("data structures") && q.includes("data structure"));
            });

            if (course) {
                data = {
                    course: course.course_name,
                    classesAttended: course.classes_attended,
                    totalClasses: course.total_classes,
                    percentage: course.total_classes > 0
                        ? Number((
                            course.classes_attended /
                            course.total_classes * 100
                        ).toFixed(2))
                        : 0
                };
            } else {
                data = {
                    courses: courses.map(course => ({
                        course: course.course_name,
                        classesAttended: course.classes_attended,
                        totalClasses: course.total_classes,
                        percentage: course.total_classes > 0
                            ? Number((
                                course.classes_attended /
                                course.total_classes * 100
                            ).toFixed(2))
                            : 0
                    }))
                };
            }
        }

        // Fees
        else if (
            q.includes("fee") ||
            q.includes("payment") ||
            q.includes("paid") ||
            q.includes("owe") ||
            q.includes("pending amount")
        ) {
            const fees = db.prepare(`
                SELECT total_fee, amount_paid
                FROM fees
                WHERE student_id = ?
            `).get("DEMO001");

            data = fees ? {
                totalFee: fees.total_fee,
                amountPaid: fees.amount_paid,
                pendingAmount: fees.total_fee - fees.amount_paid
            } : null;
        }

        // All courses or general course comparison
        else if (
            q.includes("all subjects") ||
            q.includes("all courses") ||
            q.includes("compare my subjects") ||
            q.includes("course list")
        ) {
            data = { courses: getCourses() };
        }

        // Hostel data is not in the database yet
        else if (q.includes("hostel") || q.includes("room number")) {
            return res.json({
                reply:
                    "I can open the hostel section, but actual hostel " +
                    "records have not been connected to the database yet."
            });
        }

        // General question: ask AI without inventing portal data
        else {
            const reply = await askAI(question, {
                note: "No portal records were selected for this question."
            });

            return res.json({ reply });
        }

        // Let the AI explain the actual database result
        const reply = await askAI(question, data);

        res.json({ reply, data });

    } catch (error) {
        console.error("Chat error:", error);

        res.status(500).json({
            error: "Assistant unavailable. Check that Ollama is running."
        });
    }
});

// Get all courses
app.get("/api/courses", (req, res) => {
    try {
        res.json({ courses: getCourses() });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Could not retrieve courses."
        });
    }
});

// Get marks for one course
app.get("/api/marks", (req, res) => {
    try {
        const courseName = req.query.course;

        if (typeof courseName !== "string" || !courseName.trim()) {
            return res.status(400).json({
                error: "Provide a course name."
            });
        }

        const course = db.prepare(`
            SELECT course_name, marks_obtained, total_marks
            FROM courses
            WHERE student_id = ?
              AND LOWER(course_name) LIKE LOWER(?)
        `).get("DEMO001", `%${courseName.trim()}%`);

        if (!course) {
            return res.status(404).json({
                error: "Course not found."
            });
        }

        res.json({ course });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Could not retrieve marks."
        });
    }
});

// Get attendance
app.get("/api/attendance", (req, res) => {
    try {
        const courseName = req.query.course;

        if (typeof courseName !== "string" || !courseName.trim()) {
            return res.status(400).json({
                error: "Provide a course name."
            });
        }

        const course = db.prepare(`
            SELECT course_name, classes_attended, total_classes
            FROM courses
            WHERE student_id = ?
              AND LOWER(course_name) LIKE LOWER(?)
        `).get("DEMO001", `%${courseName.trim()}%`);

        if (!course) {
            return res.status(404).json({
                error: "Course not found."
            });
        }

        res.json({
            course: course.course_name,
            classesAttended: course.classes_attended,
            totalClasses: course.total_classes,
            attendancePercentage: course.total_classes > 0
                ? Number((
                    course.classes_attended /
                    course.total_classes * 100
                ).toFixed(2))
                : 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Could not retrieve attendance."
        });
    }
});

// Get fees
app.get("/api/fees", (req, res) => {
    try {
        const fees = db.prepare(`
            SELECT total_fee, amount_paid
            FROM fees
            WHERE student_id = ?
        `).get("DEMO001");

        if (!fees) {
            return res.status(404).json({
                error: "Fee record not found."
            });
        }

        res.json({
            totalFee: fees.total_fee,
            amountPaid: fees.amount_paid,
            pendingAmount: fees.total_fee - fees.amount_paid
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Could not retrieve fees."
        });
    }
});

// Inspect a website with Playwright
app.post("/api/inspect", async (req, res) => {
    try {
        const { url } = req.body;

        if (
            typeof url !== "string" ||
            !/^https?:\/\//i.test(url)
        ) {
            return res.status(400).json({
                error: "Please provide a valid HTTP or HTTPS URL."
            });
        }

        const details = await inspectWebsite(url);
        res.json(details);
    } catch (error) {
        console.error("Website inspection error:", error);
        res.status(500).json({
            error: "Could not inspect this website."
        });
    }
});

app.listen(3000, () => {
    console.log("Website running at http://localhost:3000");
});
