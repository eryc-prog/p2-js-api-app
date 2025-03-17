// API Configuration - Fetch API key dynamically
let myAPIKey = "";

async function getAPIKey() {
  try {
    const response = await fetch("/.netlify/functions/fetchAPIKey");
    if (!response.ok) {
      throw new Error("Failed to fetch API key");
    }
    const data = await response.json();
    myAPIKey = data.apiKey;
    console.log("API Key fetched successfully");
  } catch (error) {
    console.error("Error fetching API key:", error);
    alert("Failed to load API configuration.");
  }
}

// Available topics for question generation
const topics = [
  "Artificial Intelligence",
  "Computer Programming",
  "Data Science",
  "Web Development",
  "Cybersecurity",
  "Cloud Computing",
  "Mathematics",
  "Physics",
  "Biology",
  "Chemistry",
  "World History",
  "Geography",
  "Literature",
  "Music Theory",
  "Art History",
];

// Function to check API configuration
function checkConfig() {
  if (!myAPIKey) {
    console.error("API key is not available");
    alert("Application is not properly configured.");
    return false;
  }
  return true;
}

// Function to generate AI questions
async function generateAIQuestions() {
  if (!myAPIKey) {
    await getAPIKey(); // Fetch API key dynamically if not available
    if (!myAPIKey) return;
  }

  const topicSelector = document.getElementById("topicSelector");
  if (!topicSelector || !topicSelector.value) {
    alert("Please select a topic first!");
    return;
  }

  const selectedTopic = topicSelector.value;
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (loadingIndicator) loadingIndicator.style.display = "block";

  const prompt = `Generate a multiple-choice question about ${selectedTopic} with exactly this format:
Question: [Your question here]
1. [Correct answer]
2. [Wrong answer]
3. [Wrong answer]
4. [Wrong answer]
Answer: [Exact text of correct answer]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${myAPIKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      console.log("AI Response:", aiResponse);
      addAIQuestionToFlashcards(aiResponse, selectedTopic);
    } else {
      throw new Error("No valid response from Gemini API");
    }
  } catch (error) {
    console.error("Error generating question:", error);
    alert("Failed to generate question. Please try again.");
  } finally {
    if (loadingIndicator) loadingIndicator.style.display = "none";
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", async () => {
  await getAPIKey(); // Fetch API key when app loads
  if (checkConfig()) {
    createTopicSelector();
    updateCard();
  }
});
