
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "campus.db"));

// Create the courses table
db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        course_name TEXT NOT NULL,
        marks_obtained REAL NOT NULL,
        total_marks REAL NOT NULL,
        classes_attended INTEGER NOT NULL,
        total_classes INTEGER NOT NULL
    );
`);

// Create the fees table
db.exec(`
    CREATE TABLE IF NOT EXISTS fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        total_fee REAL NOT NULL,
        amount_paid REAL NOT NULL
    );
`);

// Insert sample data only when the tables are empty
const courseCount = db.prepare(
    "SELECT COUNT(*) AS count FROM courses"
).get().count;

if (courseCount === 0) {
    const insertCourse = db.prepare(`
        INSERT INTO courses (
            student_id,
            course_name,
            marks_obtained,
            total_marks,
            classes_attended,
            total_classes
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const courses = [
        ["DEMO001", "Database Management Systems", 42, 50, 44, 50],
        ["DEMO001", "Design and Analysis of Algorithms", 40, 50, 41, 50],
        ["DEMO001", "Java Programming", 45, 50, 46, 50],
        ["DEMO001", "Computer Organization", 38, 50, 40, 50],
        ["DEMO001", "Discrete Mathematics", 43, 50, 45, 50],
        ["DEMO001", "Data Structures", 44, 50, 42, 50]
    ];

    const insertAllCourses = db.transaction((rows) => {
        for (const course of rows) {
            insertCourse.run(...course);
        }
    });

    insertAllCourses(courses);
}

const feeCount = db.prepare(
    "SELECT COUNT(*) AS count FROM fees"
).get().count;

if (feeCount === 0) {
    db.prepare(`
        INSERT INTO fees (student_id, total_fee, amount_paid)
        VALUES (?, ?, ?)
    `).run("DEMO001", 100000, 80000);
}

module.exports = db;
