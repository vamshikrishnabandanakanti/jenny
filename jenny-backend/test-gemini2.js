const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyCMATWjHiklAtQT0Z_Mlc6yNIKQ3J2FSsM");

async function testModel(modelName) {
  const model = genAI.getGenerativeModel({ model: modelName });
  try {
    let promises = [];
    for (let i = 0; i < 6; i++) {
        promises.push(model.generateContent("Say hello " + i));
    }
    const results = await Promise.all(promises);
    console.log(modelName, "SUCCESS");
  } catch(e) {
    console.error(modelName, "Error:", e.message);
  }
}
async function run() {
    await testModel("gemini-2.0-flash-lite-preview-02-05");
    await testModel("gemini-2.0-flash-lite-001");
    await testModel("gemini-flash-latest");
}
run();
