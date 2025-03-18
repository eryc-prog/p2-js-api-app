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

// Initialize flashcards with a default card
let flashcards = [
  {
    question: "What is machine learning?",
    options: [
      "A type of artificial intelligence that allows systems to learn from data",
      "A programming language",
      "A type of computer hardware",
      "A database management system",
    ],
    answer:
      "A type of artificial intelligence that allows systems to learn from data",
    topic: "Artificial Intelligence",
  },
];
let currentIndex = 0;
let score = 0;
let selectedAnswer = "";

// Function to check API configuration
function checkConfig() {
  if (!myAPIKey) {
    console.error("API key is not available");
    alert("Application is not properly configured.");
    return false;
  }
  return true;
}

// Function to create topic selector
function createTopicSelector() {
  const container = document.getElementById("topicSelectorContainer");
  if (!container) return;

  const select = document.createElement("select");
  select.id = "topicSelector";
  select.classList.add("topic-selector");

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a topic";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  select.appendChild(defaultOption);

  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    select.appendChild(option);
  });

  container.appendChild(select);
}

// Function to update and display the current flashcard
function updateCard() {
  if (flashcards.length === 0) {
    console.log("No flashcards available");
    return;
  }

  const flashcard = document.getElementById("flashcard");
  const optionsContainer = document.getElementById("options");
  const explanationDisplay = document.getElementById("explanation");
  const topicDisplay = document.getElementById("currentTopic");

  if (!flashcard || !optionsContainer) {
    console.error("Required DOM elements not found");
    return;
  }

  flashcard.textContent = flashcards[currentIndex].question;
  optionsContainer.innerHTML = "";
  explanationDisplay.textContent = "";
  if (topicDisplay) {
    topicDisplay.textContent = `Topic: ${flashcards[currentIndex].topic}`;
  }
  selectedAnswer = "";

  flashcards[currentIndex].options.forEach((option) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.classList.add("option");
    button.onclick = () => selectAnswer(option);
    optionsContainer.appendChild(button);
  });

  const prevButton = document.getElementById("prevButton");
  const nextButton = document.getElementById("nextButton");
  if (prevButton) prevButton.disabled = currentIndex === 0;
  if (nextButton) nextButton.disabled = currentIndex === flashcards.length - 1;
}

// Function to select an answer
function selectAnswer(answer) {
  selectedAnswer = answer;
  const options = document.querySelectorAll(".option");
  options.forEach((button) => {
    button.classList.remove("selected");
    if (button.textContent === answer) {
      button.classList.add("selected");
    }
  });
}

// Function to validate and submit answer
function submitAnswer() {
  if (!selectedAnswer) {
    alert("Please select an answer first!");
    return;
  }

  const scoreDisplay = document.getElementById("score");
  const explanationDisplay = document.getElementById("explanation");

  const isCorrect = selectedAnswer === flashcards[currentIndex].answer;
  if (isCorrect) {
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
    explanationDisplay.textContent = "Correct!";
    explanationDisplay.style.color = "green";
  } else {
    explanationDisplay.textContent = `Wrong! The correct answer is: ${flashcards[currentIndex].answer}`;
    explanationDisplay.style.color = "red";
  }

  setTimeout(() => {
    if (currentIndex < flashcards.length - 1) {
      currentIndex++;
      updateCard();
    }
  }, 2000);
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

// Function to parse AI response and add to flashcards
function addAIQuestionToFlashcards(aiText, topic) {
  const lines = aiText.split("\n").filter((line) => line.trim());

  let question = "";
  const options = [];
  let answer = "";

  lines.forEach((line) => {
    if (line.toLowerCase().startsWith("question:")) {
      question = line.replace(/^question:\s*/i, "").trim();
    } else if (/^\d+\./.test(line)) {
      options.push(line.replace(/^\d+\.\s*/, "").trim());
    } else if (line.toLowerCase().startsWith("answer:")) {
      answer = line.replace(/^answer:\s*/i, "").trim();
    }
  });

  if (question && options.length === 4 && answer) {
    flashcards.push({
      question: question,
      options: options,
      answer: answer,
      topic: topic,
    });

    if (flashcards.length === 1 || currentIndex === flashcards.length - 2) {
      currentIndex = flashcards.length - 1;
      updateCard();
    }
  } else {
    console.error("Invalid AI response format:", aiText);
    alert(
      "Failed to parse AI response. Please try generating another question."
    );
  }
}

// Navigation functions
function previousCard() {
  if (currentIndex > 0) {
    currentIndex--;
    updateCard();
  }
}

function nextCard() {
  if (currentIndex < flashcards.length - 1) {
    currentIndex++;
    updateCard();
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
