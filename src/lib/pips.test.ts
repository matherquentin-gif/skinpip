import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUsdToPips, pipsToDisplay, pipsToExact, pipsToSplit, pipsToUSD, sellerNetPips } from "./pips";

test("pipsToUSD keeps every pip below one cent", () => {
  assert.equal(pipsToUSD(1n), "$0.00001");
  assert.equal(pipsToUSD(7n), "$0.00007");
  assert.equal(pipsToUSD(455n), "$0.00455");
  assert.equal(pipsToUSD(999n), "$0.00999");
});

test("pipsToUSD uses 4 decimals under $1 and cents above", () => {
  assert.equal(pipsToUSD(1_000n), "$0.0100");
  assert.equal(pipsToUSD(78_000n), "$0.7800");
  assert.equal(pipsToUSD(124_755_200n), "$1,247.55");
  assert.equal(pipsToUSD(124_755_500n), "$1,247.56"); // half rounds away from zero
  assert.equal(pipsToUSD(0n), "$0.00000");
});

test("pipsToUSD formats large values exactly", () => {
  // Beyond Number's 2^53 integer range.
  assert.equal(pipsToUSD(123_456_789_012_345_678n), "$1,234,567,890,123.46");
});

test("pipsToDisplay matches pipsToUSD without the symbol", () => {
  assert.equal(pipsToDisplay(450n), "0.00450");
  assert.equal(pipsToDisplay(1_850_000_000n), "18,500.00");
  assert.equal(pipsToDisplay(-2_500n), "-0.0250");
});

test("pipsToSplit is exact: 5 decimals below a cent or when needed, else 4", () => {
  assert.deepEqual(pipsToSplit(7n), { whole: "$0.", sub: "00007" });
  assert.deepEqual(pipsToSplit(200n), { whole: "$0.", sub: "00200" });
  assert.deepEqual(pipsToSplit(124_755_200n), { whole: "$1,247.", sub: "5520" });
  assert.deepEqual(pipsToSplit(124_755_201n), { whole: "$1,247.", sub: "55201" });
  // A $0.99999 balance must never display as $1.0000.
  assert.deepEqual(pipsToSplit(99_999n), { whole: "$0.", sub: "99999" });
});

test("pipsToUSD switches to cents when 4-place rounding would reach $1", () => {
  assert.equal(pipsToUSD(99_994n), "$0.9999");
  assert.equal(pipsToUSD(99_995n), "$1.00");
});

test("parseUsdToPips parses exact decimal input", () => {
  assert.equal(parseUsdToPips("12"), 1_200_000n);
  assert.equal(parseUsdToPips("0.00001"), 1n);
  assert.equal(parseUsdToPips(".5"), 50_000n);
  assert.equal(parseUsdToPips("$1,234.5"), 123_450_000n);
  assert.equal(parseUsdToPips("1,234,567"), 123_456_700_000n);
  assert.equal(parseUsdToPips("  3. "), 300_000n);
});

test("parseUsdToPips rejects invalid or sub-pip input", () => {
  assert.equal(parseUsdToPips(""), null);
  assert.equal(parseUsdToPips("."), null);
  assert.equal(parseUsdToPips("abc"), null);
  assert.equal(parseUsdToPips("-1"), null);
  assert.equal(parseUsdToPips("1e5"), null);
  assert.equal(parseUsdToPips("0.000001"), null);
  assert.equal(parseUsdToPips("1,2,3"), null);
  assert.equal(parseUsdToPips("12,34.5"), null);
});

test("sellerNetPips takes the 2% fee", () => {
  assert.equal(sellerNetPips(100_000n), 98_000n);
});

test("pipsToExact keeps full precision and round-trips through the parser", () => {
  assert.equal(pipsToExact(118_000_100n), "1180.001");
  assert.equal(pipsToExact(45n), "0.00045");
  assert.equal(pipsToExact(1_250_000n), "12.50");
  assert.equal(pipsToExact(123_456_789n), "1234.56789");
  for (const p of [0n, 1n, 45n, 118_000_100n, 123_456_789n]) {
    assert.equal(parseUsdToPips(pipsToExact(p)), p);
  }
});
