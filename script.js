/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// System prompt to guide the AI's responses
const systemPrompt = `You are L'Oréal's Smart Product Advisor, an AI beauty consultant specializing in L'Oréal products and skincare/beauty routines. 

Your responsibilities:
- Answer questions ONLY about L'Oréal products, beauty routines, and skincare recommendations
- Provide accurate product recommendations based on user needs
- Share application tips and beauty routines
- Explain product ingredients and benefits
- Help users develop personalized skincare routines

Important guidelines:
- Only discuss L'Oréal products and beauty-related topics
- If asked about competitor products, politely redirect to equivalent L'Oréal options
- For medical conditions, advise consulting a healthcare professional
- Maintain a professional, friendly, and helpful tone
- Keep responses clear and concise
- If unsure about something, acknowledge it and suggest consulting L'Oréal's website or a beauty advisor

Do not:
- Provide medical advice
- Discuss topics unrelated to beauty/skincare
- Make claims about products that aren't supported by L'Oréal
- Share specific pricing information
- Engage in discussions about competitors`;

// Store conversation history
let conversationHistory = [{ role: "system", content: systemPrompt }];

// Add initial greeting message
const initialMessage =
  "👋 Hello! I'm your L'Oréal Smart Product Advisor. How can I help you with your beauty and skincare needs today?";
chatWindow.innerHTML = `<div class="msg ai">${initialMessage}</div>`;
conversationHistory.push({ role: "assistant", content: initialMessage });

// Function to add a message to the chat window
function addMessageToChat(message, role) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("msg", role);
  messageDiv.textContent = message;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Function to send request to Cloudflare Worker
async function getAIResponse(userMessage) {
  try {
    const response = await fetch(
      "https://loreal-worker.montg2ml.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error:", error);
    return "I apologize, but I seem to be having trouble at the moment. Please try again later.";
  }
}

// Handle form submission
chatForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  // Clear input
  userInput.value = "";

  // Add user message to chat
  addMessageToChat(message, "user");

  // Update conversation history
  conversationHistory.push({ role: "user", content: message });

  // Show loading state
  const loadingDot = document.createElement("div");
  loadingDot.classList.add("msg", "ai", "loading");
  loadingDot.textContent = "Typing...";
  chatWindow.appendChild(loadingDot);

  // Get AI response
  const aiResponse = await getAIResponse(message);

  // Remove loading indicator
  chatWindow.removeChild(loadingDot);

  // Add AI response to chat
  addMessageToChat(aiResponse, "ai");

  // Update conversation history
  conversationHistory.push({ role: "assistant", content: aiResponse });

  // Limit conversation history to last 10 messages to prevent token limit issues
  if (conversationHistory.length > 11) {
    // 11 because we include the system prompt
    conversationHistory = [
      conversationHistory[0], // Keep system prompt
      ...conversationHistory.slice(-10), // Keep last 10 messages
    ];
  }
});
