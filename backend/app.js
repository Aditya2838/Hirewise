require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pdfParse = require("pdf-parse");
const fs = require("fs");


const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Use environment variable



// ✅ Add these middlewares
app.use(cors()); // Fix CORS issues
app.use(express.json()); // Enable JSON parsing
app.use(express.urlencoded({ extended: true })); // Support URL-encoded bodies
// MongoDB Connection
const mongoURI = "mongodb://127.0.0.1:27017/hirewise"; 

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true // Add this line
});


const db = mongoose.connection;
db.on("connected", () => console.log("✅ MongoDB Connected Successfully"));
db.on("error", (err) => console.error("❌ MongoDB Connection Error:", err));
db.on("disconnected", () => console.log("⚠️ MongoDB Disconnected"));











const userQuerySchema = new mongoose.Schema({
    email: String
});
const UserQuery = mongoose.model("UserQuery", userQuerySchema); // New Collection: "user_queries"

// POST Route to save contact details
app.post("/user-queries", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required!" });
        }
        const newQuery = new UserQuery({ email });
        await newQuery.save();
        res.status(201).json({ message: "Query submitted successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});











app.post("/change-password", async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
  
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found!" });
  
      // Check if old password matches
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: "Incorrect old password!" });
  
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // Update password in MongoDB
      await User.updateOne({ email }, { $set: { password: hashedPassword } });
  
      res.json({ message: "Password updated successfully!" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });



// Skill list for simple matching
const skillsList = ["Java", "Python", "Machine Learning", "React", "SQL", "AI", "Node.js"];

// Extract skills from text
function extractSkills(text) {
    return skillsList.filter(skill => text.toLowerCase().includes(skill.toLowerCase()));
}

// Extract email from text
function extractEmail(text) {
    const match = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    return match ? match[0] : "Not Found";
}

// Extract phone number
function extractPhone(text) {
    const match = text.match(/\+?\d[\d -]{8,12}\d/);
    return match ? match[0] : "Not Found";
}

// Extract experience
function extractExperience(text) {
    const match = text.match(/(\d+ years? experience|\d+ yrs experience)/);
    return match ? match[0] : "Not Found";
}

// Extract education
function extractEducation(text) {
    const match = text.match(/(Bachelor|Master|PhD) in [A-Za-z ]+/);
    return match ? match[0] : "Not Found";
}
const ContactSchema = new mongoose.Schema({
    name: String,
    subject: String,
    email: String,
    phone: String,
    message: String
}, { timestamps: true });

const Contact = mongoose.model("Contact", ContactSchema);

// API endpoint to handle contact form submissions
app.post("/contact", async (req, res) => {
    try {
        console.log("Received Data:", req.body); // Debugging
        const { name, subject, email, phone, message } = req.body;

        if (!name || !subject || !email || !phone || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const contact = new Contact({ name, subject, email, phone, message });
        await contact.save();

        res.status(201).json({ message: "Message sent successfully" });
    } catch (error) {
        console.error("Error saving contact:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Serve uploaded files
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

// Signup Route
app.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Access Denied. Please log in." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid Token" });

        req.user = user;
        next();
    });
};

app.get("/dashboard", authenticateToken, (req, res) => {
    res.json({ message: "Welcome to your dashboard" });
});



















const jobSchema = new mongoose.Schema({
    title: String,
    category: String,
    type: String,
    deadline: String,
    salary: String,
    description: String,
    company: String,
    website: String,
    location: String,
    logo: String,
});

const Job = mongoose.model("Job", jobSchema);

// API to post a job
app.post("/post-job", async (req, res) => {
    try {
        const job = new Job(req.body);
        await job.save();
        res.status(201).json({ message: "Job posted successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error posting job" });
    }
});

// API to get job listings
app.get("/jobs", async (req, res) => {
    try {
        const jobs = await Job.find();
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: "Error fetching jobs" });
    }
});































const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage: storage });

// MongoDB Schema
const Application = mongoose.model("Application", new mongoose.Schema({
    name: String,
    email: String,
    profession: String,
    company: String,
    role: String,
    resume: String
}));

// Handle Form Submission
app.post("/submit", upload.single("resume"), async (req, res) => {
    try {
        const { name, email, profession, company, role } = req.body;
        const resume = req.file ? req.file.filename : null;

        const newApplication = new Application({ name, email, profession, company, role, resume });
        await newApplication.save();

        res.json({ message: "Application submitted successfully!" });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Failed to submit application." });
    }
});






























// Login Route
app.post("/auth/login", async (req, res) => {
    try {
        
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "Login successful", token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Define Resume Schema
const ResumeSchema = new mongoose.Schema({
  name: String,
  email: String,
  profession: String,
  location: String,
  website: String,
  salary: String,
  age: String,
  education: {
      degree: String,
      field: String,
      from: String,
      to: String,
      school: String,
      description: String
  },
  experience: {
      company: String,
      title: String,
      dateFrom: String,
      dateTo: String,
      description: String
  },
  skills: [{ name: String, proficiency: Number }]
});

const Resume = mongoose.model("Resume", ResumeSchema);

// API to save resume
app.post("/resume", async (req, res) => {
  try {
      const newResume = new Resume(req.body);
      await newResume.save();
      res.status(201).json({ message: "Resume saved successfully!" });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});



// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
