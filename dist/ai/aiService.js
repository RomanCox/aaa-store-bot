"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAI = callAI;
const bottleneck_1 = __importDefault(require("bottleneck"));
const askAi_1 = require("./askAi");
// ---------------- cache ----------------
const memoryCache = new Map();
const pending = new Map();
// ---------------- limiter ----------------
const aiLimiter = new bottleneck_1.default({
    maxConcurrent: 3,
    minTime: 200, // защита от rate limit OpenRouter
});
// ---------------- retry ----------------
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function withRetry(fn, retries = 2) {
    try {
        return await fn();
    }
    catch (e) {
        if (retries <= 0)
            throw e;
        await sleep(300);
        return withRetry(fn, retries - 1);
    }
}
// ---------------- main API ----------------
async function callAI(prompt) {
    // 1. cache hit
    const cached = memoryCache.get(prompt);
    if (cached)
        return cached;
    // 2. deduplicate in-flight requests
    if (pending.has(prompt)) {
        return pending.get(prompt);
    }
    // 3. create job
    const job = aiLimiter.schedule(async () => {
        const result = await withRetry(() => (0, askAi_1.askAI)(prompt));
        if (!result) {
            return null;
        }
        memoryCache.set(prompt, result);
        return result;
    });
    // 4. store pending
    pending.set(prompt, job);
    try {
        return await job;
    }
    finally {
        pending.delete(prompt);
    }
}
