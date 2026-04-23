const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyCMATWjHiklAtQT0Z_Mlc6yNIKQ3J2FSsM");
async function run() {
  const models = await genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  try {
    const result = await models.generateContent("Hello");
    console.log("Response:", result.response.text());
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
