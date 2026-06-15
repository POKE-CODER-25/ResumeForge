import assert from 'node:assert/strict'
import { analyzeResumeText } from '../src/utils/resumeTextAnalyzer.js'

const sampleResume = `R. Pruthvi Adithya Raj
AI Product Builder · Generative AI Developer · Creative Systems Designer
adithyarajatp@gmail.com | +91-6304138387 | linkedin.com/in/pruthvi-ai-developer | github.com/POKE-CODER-25 | volt-sensei.web.app
| Andhra Pradesh, India
PROFESSIONAL SUMMARY
Ambitious AI-focused developer with a builder’s mindset, passionate about crafting real-world generative AI experiences that merge
technology with creativity. Designed and shipped Volt Sensei, an AI-powered JEE learning platform.
PROJECTS
Volt Sensei — AI-Powered JEE Learning Platform | Launched · 2026
Stack: React.js · Firebase · Tailwind CSS · Generative AI
• Engineered and deployed Volt Sensei using React and Firebase.
• Architected AI-generated quizzes with XP progression.
• Built immersive 3D educational models.
• Implemented Firebase Authentication and Firestore.
AI Fitness Transformation App | In Development · 2026
Stack: React Native / React · Firebase · Generative AI
• Designing personalized transformation roadmaps.
• Building gamified discipline and streak systems.
King’s Guess — Multiplayer Social Strategy Game | In Development · 2026
Stack: React.js · Firebase Realtime DB · WebSockets
• Developing friends-only multiplayer rooms.
• Building real-time room synchronization.
TECHNICAL SKILLS
AI & Prompt Engineering: Generative AI, Prompt Engineering, AI Workflow Design
Frontend: React.js, Tailwind CSS, JavaScript
Backend & Infrastructure: Firebase Auth, Firestore, Cloud Deployment
Design & Strategy: UI/UX Thinking, Git/GitHub, Product Ideation
EDUCATION
Bachelor of Technology — CSE (Data Science) | 2023 – 2027 (Expected)
G. Pulla Reddy Engineering College, Andhra Pradesh · CGPA: 8.1 / 10
CERTIFICATIONS
• Prompt Engineering for Developers — Infosys Springboard
• Generative AI Fundamentals — Infosys Springboard
• Cloud Computing Essentials — Infosys Springboard
• GitHub & Version Control — Infosys Springboard
• AI First Software Engineering — Infosys Springboard
• Data Science — Infosys Springboard`

const { resumeData } = analyzeResumeText(sampleResume)
const linkedProject = analyzeResumeText(`PROJECTS
Portfolio App | Launched · 2026
Stack: React.js · Firebase
github.com/example/portfolio | portfolio-app.vercel.app
• Built and deployed the application.`).resumeData.projects[0]

assert.equal(resumeData.projects.length, 3)
assert.equal(resumeData.certifications.length, 6)
assert.equal(resumeData.personalDetails.location, 'Andhra Pradesh, India')
assert.ok(resumeData.personalDetails.targetRole)
assert.ok(resumeData.personalDetails.github)
assert.ok(resumeData.personalDetails.linkedin)
assert.ok(resumeData.personalDetails.portfolio)
assert.equal(linkedProject.githubLink, 'https://github.com/example/portfolio')
assert.equal(linkedProject.liveLink, 'https://portfolio-app.vercel.app')
assert.deepEqual(
  resumeData.projects.map((project) => project.highlights.split('\n').length),
  [4, 2, 2],
)

console.log('Resume text analyzer smoke test passed.')
