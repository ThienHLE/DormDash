import test from "node:test";
import assert from "node:assert/strict";
import { calculateEstimatedMinutes } from "./estimatedDeliveryTime.js";

// Test 1: Convert exact minutes.
test("converts 540 seconds into 9 minutes", () => {
    assert.equal(calculateEstimatedMinutes(540), 9);
});

// Test 2: Round partial minutes upward.
test("rounds 550 seconds up to 10 minutes", () => {
    assert.equal(calculateEstimatedMinutes(550), 10);
});

// Test 3: Handle zero duration.
test("returns zero for zero seconds", () => {
    assert.equal(calculateEstimatedMinutes(0), 0);
});

// Test 4: Reject negative durations.
test("rejects negative durations", () => {
    assert.equal(calculateEstimatedMinutes(-30), null);
});

// Test 5: Reject NaN.
test("rejects NaN", () => {
    assert.equal(calculateEstimatedMinutes(NaN), null);
});

// Test 6: Reject Infinity.
test("rejects Infinity", () => {
    assert.equal(calculateEstimatedMinutes(Infinity), null);
});

// Test 7: Reject nonnumeric values.
test("rejects strings and missing durations", () => {
    assert.equal(calculateEstimatedMinutes("540"), null);
    assert.equal(calculateEstimatedMinutes(undefined), null);
});