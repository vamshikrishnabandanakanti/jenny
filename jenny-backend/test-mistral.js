const { Mistral } = require("@mistralai/mistralai");
const client = new Mistral({ apiKey: "Ma0aTtAp22dd6QKJIMxPeTcvna3AGhxU" });
async function run() {
  try {
    const chatResponse = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [{role: 'user', content: 'Say hello world'}],
    });
    console.log("Success:", chatResponse.choices[0].message.content);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
