// services/taskQueue.js
const queue = [];
let isProcessing = false;

async function addTask(taskFn) {
  queue.push(taskFn);
  processNext();
}

async function processNext() {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;
  const nextTask = queue.shift();

  try {
    await nextTask();
  } catch (err) {
    console.error("❌ TaskQueue Error:", err);
  } finally {
    isProcessing = false;
    // Tiếp tục với task tiếp theo
    processNext();
  }
}

module.exports = { addTask };
