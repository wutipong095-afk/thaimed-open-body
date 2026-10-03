import assert from "node:assert/strict";
import { readReviews, currentReview } from "../web/js/reviews.js";
import { loadSession } from "../web/js/session.js";

const approved = { target: "knowledge:a", snapshot: "original", status: "approved", reviewer: "Expert", at: "2026-10-03T00:00:00Z" };
const changes = { ...approved, status: "changes" };
const storage = (value) => ({ getItem: () => value });
assert.deepEqual(readReviews(storage(null)), []);
assert.throws(() => readReviews(storage("broken")));
assert.throws(() => readReviews(storage('{"reviews":[]}')));
assert.throws(() => readReviews(storage('[{"target":"a"}]')));
assert.equal(currentReview([approved], "knowledge:a", "original"), approved);
assert.equal(currentReview([approved], "knowledge:a", "edited"), null);
assert.equal(currentReview([approved], "knowledge:b", "original"), null);
assert.equal(currentReview([approved, changes], "knowledge:a", "original"), changes);
assert.equal(currentReview([approved, { ...changes, snapshot: "edited" }], "knowledge:a", "original"), null);
globalThis.localStorage = storage(JSON.stringify({ role: "expert", items: [] }));
assert.equal(loadSession().role, "expert");
console.log("OK: review history, revision invalidation, corrupt storage and expert role persistence");
