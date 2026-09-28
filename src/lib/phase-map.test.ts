import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_PHASES, PHASE_MAP, getPhaseLabel } from "./phase-map";

test("Doppler and Gamma Doppler paint indexes map to the right phase", () => {
  assert.equal(getPhaseLabel(415), "Ruby");
  assert.equal(getPhaseLabel(416), "Sapphire");
  assert.equal(getPhaseLabel(417), "Black Pearl");
  assert.equal(getPhaseLabel(418), "Phase 1");
  assert.equal(getPhaseLabel(421), "Phase 4");
  assert.equal(getPhaseLabel(568), "Emerald");
  assert.equal(getPhaseLabel(569), "Gamma Phase 1");
  assert.equal(getPhaseLabel(572), "Gamma Phase 4");
  assert.equal(getPhaseLabel(44), null);
});

test("every mapped label is a filterable phase", () => {
  for (const label of Object.values(PHASE_MAP)) {
    assert.ok(ALL_PHASES.includes(label), `${label} missing from ALL_PHASES`);
  }
});
