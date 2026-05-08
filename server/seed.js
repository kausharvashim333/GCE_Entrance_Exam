require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Question = require("./models/Question");
const Student = require("./models/Student");

const sampleQuestions = [
  { subject: "Computer Fundamentals", topic: "Basics", question: "What does CPU stand for?", options: ["Central Processing Unit", "Central Program Unit", "Computer Personal Unit", "Central Processor Utility"], correctAnswer: 0, difficulty: "easy", marks: 1 },
  { subject: "Computer Fundamentals", topic: "Basics", question: "Which is the brain of the computer?", options: ["RAM", "CPU", "Hard Disk", "Monitor"], correctAnswer: 1, difficulty: "easy", marks: 1 },
  { subject: "Computer Fundamentals", topic: "Memory", question: "1 KB equals how many bytes?", options: ["1000", "1024", "512", "2048"], correctAnswer: 1, difficulty: "easy", marks: 1 },
  { subject: "Computer Fundamentals", topic: "Memory", question: "Which of the following is volatile memory?", options: ["ROM", "Hard Disk", "RAM", "SSD"], correctAnswer: 2, difficulty: "easy", marks: 1 },
  { subject: "Computer Fundamentals", topic: "I/O", question: "Which device is used for input?", options: ["Printer", "Monitor", "Keyboard", "Speaker"], correctAnswer: 2, difficulty: "easy", marks: 1 },
  { subject: "Programming", topic: "C Language", question: "Who developed C language?", options: ["Bjarne Stroustrup", "Dennis Ritchie", "James Gosling", "Guido van Rossum"], correctAnswer: 1, difficulty: "medium", marks: 1 },
  { subject: "Programming", topic: "C Language", question: "Which symbol is used to terminate a statement in C?", options: [".", ",", ";", ":"], correctAnswer: 2, difficulty: "easy", marks: 1 },
  { subject: "Programming", topic: "C Language", question: "What is the size of int in C (typically)?", options: ["2 bytes", "4 bytes", "8 bytes", "1 byte"], correctAnswer: 1, difficulty: "medium", marks: 1 },
  { subject: "Programming", topic: "Python", question: "Which of the following is a valid Python list?", options: ["[1, 2, 3]", "{1, 2, 3}", "(1, 2, 3)", "<1, 2, 3>"], correctAnswer: 0, difficulty: "easy", marks: 1 },
  { subject: "Programming", topic: "Python", question: "What does 'print(type(5))' output?", options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'list'>"], correctAnswer: 0, difficulty: "easy", marks: 1 },
  { subject: "Web Development", topic: "HTML", question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correctAnswer: 0, difficulty: "easy", marks: 1 },
  { subject: "Web Development", topic: "HTML", question: "Which tag is used for the largest heading?", options: ["<h6>", "<head>", "<h1>", "<header>"], correctAnswer: 2, difficulty: "easy", marks: 1 },
  { subject: "Web Development", topic: "CSS", question: "Which property changes text color in CSS?", options: ["font-color", "text-color", "color", "foreground"], correctAnswer: 2, difficulty: "easy", marks: 1 },
  { subject: "Web Development", topic: "JavaScript", question: "Which keyword declares a variable in JavaScript?", options: ["var", "int", "string", "dim"], correctAnswer: 0, difficulty: "easy", marks: 1 },
  { subject: "Web Development", topic: "JavaScript", question: "What will 'console.log(typeof [])' output?", options: ["array", "object", "list", "undefined"], correctAnswer: 1, difficulty: "medium", marks: 1 },
  { subject: "Database", topic: "SQL", question: "Which SQL command fetches data?", options: ["INSERT", "UPDATE", "SELECT", "DELETE"], correctAnswer: 2, difficulty: "easy", marks: 1 },
  { subject: "Database", topic: "SQL", question: "What is a primary key?", options: ["Foreign key", "Unique identifier for a row", "A type of index", "A table name"], correctAnswer: 1, difficulty: "easy", marks: 1 },
  { subject: "Database", topic: "SQL", question: "Which clause filters records in SQL?", options: ["ORDER BY", "GROUP BY", "WHERE", "HAVING"], correctAnswer: 2, difficulty: "easy", marks: 1 },
  { subject: "Operating System", topic: "Windows", question: "What is the shortcut for copy?", options: ["Ctrl+X", "Ctrl+V", "Ctrl+C", "Ctrl+Z"], correctAnswer: 2, difficulty: "easy", marks: 1 },
  { subject: "Operating System", topic: "General", question: "Which is an open-source OS?", options: ["Windows", "macOS", "Linux", "iOS"], correctAnswer: 2, difficulty: "easy", marks: 1 },
  { subject: "Networking", topic: "Basics", question: "What does LAN stand for?", options: ["Large Area Network", "Local Area Network", "Long Area Network", "Light Area Network"], correctAnswer: 1, difficulty: "easy", marks: 1 },
  { subject: "Networking", topic: "Basics", question: "What is the full form of IP?", options: ["Internet Protocol", "Internal Program", "Internet Program", "Internal Protocol"], correctAnswer: 0, difficulty: "easy", marks: 1 },
  { subject: "Networking", topic: "Protocols", question: "Which protocol is used for email?", options: ["HTTP", "FTP", "SMTP", "TCP"], correctAnswer: 2, difficulty: "medium", marks: 1 },
  { subject: "MS Office", topic: "Word", question: "Which shortcut is used to save a document?", options: ["Ctrl+P", "Ctrl+S", "Ctrl+O", "Ctrl+N"], correctAnswer: 1, difficulty: "easy", marks: 1 },
  { subject: "MS Office", topic: "Excel", question: "What does a spreadsheet consist of?", options: ["Pages and paragraphs", "Rows and columns", "Slides", "Tables only"], correctAnswer: 1, difficulty: "easy", marks: 1 },
];

const sampleStudents = [
  { name: "Rahul Sharma", studentId: "GCE001", batch: "2024-Morning", course: "DCA", mobile: "9876543210" },
  { name: "Priya Patel", studentId: "GCE002", batch: "2024-Morning", course: "DCA", mobile: "9876543211" },
  { name: "Amit Kumar", studentId: "GCE003", batch: "2024-Evening", course: "PGDCA", mobile: "9876543212" },
  { name: "Sneha Gupta", studentId: "GCE004", batch: "2024-Evening", course: "PGDCA", mobile: "9876543213" },
  { name: "Vikram Singh", studentId: "GCE005", batch: "2024-Morning", course: "ADCA", mobile: "9876543214" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    await Question.deleteMany({});
    await Question.insertMany(sampleQuestions);
    console.log(`${sampleQuestions.length} questions inserted`);

    await Student.deleteMany({});
    for (const s of sampleStudents) {
      const hash = await bcrypt.hash(s.studentId, 10);
      await Student.create({ ...s, password: hash });
    }
    console.log(`${sampleStudents.length} students inserted`);

    console.log("Seed completed!");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  }
}

seed();
