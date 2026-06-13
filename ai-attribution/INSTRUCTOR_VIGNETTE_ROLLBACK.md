# Roll Back Instructors to 5 Scenarios

This note documents how to undo the instructor-selected 1-to-5 scenario flow and return instructional staff to the same fixed 5-scenario flow as students.

## Current Behavior

- Students receive 5 randomized scenarios.
- Instructors answer `inst-vignette-count` in `inst-grading-eval`.
- Instructors receive 1 to 5 randomized scenarios based on that answer.
- `vignette-count-gate` skips instructors to `post-vignette-instructor` after scenario 1, 2, 3, or 4 when that is their selected count. A selection of 5 uses the normal full sequence.

## Fast Rollback Checklist

1. In `public/ai-attribution/config.json`, remove the `inst-vignette-count` response from `inst-grading-eval`.

2. In `public/ai-attribution/config.json`, remove the `vignette-count-gate` component definition:

```json
"vignette-count-gate": {
  "type": "react-component",
  "path": "ai-attribution/assets/VignetteCountGate.tsx",
  "response": []
}
```

3. In the `sequence` section of `public/ai-attribution/config.json`, replace each wrapped scenario-closing block for scenarios 1 through 4 with the original plain closing component.

For example, replace a gate block like this:

```json
{
  "order": "fixed",
  "components": ["vignette-count-gate", "vignette-N-closing"],
  "skip": [
    {
      "name": "vignette-count-gate",
      "check": "response",
      "responseId": "vignette-count",
      "value": "N",
      "comparison": "equal",
      "to": "post-vignette-instructor"
    }
  ]
}
```

with:

```json
"vignette-N-closing"
```

Do this for `vignette-1-closing`, `vignette-2-closing`, `vignette-3-closing`, and `vignette-4-closing`.

4. Delete `src/public/ai-attribution/assets/VignetteCountGate.tsx`.

5. In `src/public/ai-attribution/assets/vignetteAssignment.ts`, restore a single fixed scenario count:

```ts
const VIGNETTES_PER_PARTICIPANT = Math.min(5, availableVignetteIds.length);
```

Remove:

- `DEFAULT_VIGNETTES_PER_PARTICIPANT`
- `MIN_INSTRUCTOR_VIGNETTES_PER_PARTICIPANT`
- `MAX_INSTRUCTOR_VIGNETTES_PER_PARTICIPANT`
- `STUDENT_ROLE`
- `getInstructorVignetteCount`
- `getVignetteCountForRole`
- the `vignetteCount` parameter from `pickLeastAssigned`, `getAssignmentLocal`, `getAssignmentSupabase`, `getAssignmentFirebase`, and `getVignetteAssignment`
- any `.slice(0, getVignetteCount(vignetteCount))` on existing assignments

Then make each assignment path call:

```ts
pickLeastAssigned(counts)
```

and make `getVignetteAssignment` return the backend assignment without accepting a count argument.

6. In `src/public/ai-attribution/assets/VignetteIntroWithAssignment.tsx`, remove the role/count logic and call:

```ts
const ids = await getVignetteAssignment(participantId);
```

Restore the intro wording to:

```tsx
<strong>5 different scenarios</strong>
```

and the badge label to:

```tsx
<strong>You are assigned vignettes: </strong>
```

7. In `src/public/ai-attribution/assets/VignetteScenario.tsx`, remove the role/count logic and call:

```ts
const ids = await getVignetteAssignment(participantId);
```

Restore the header to:

```tsx
of 5
```

8. Optionally, in `public/ai-attribution/config.json`, restore instructor post-vignette wording from `scenario(s)` back to `Across all scenarios` if instructors are reviewing all 5 again.

## Verification

After rollback, run:

```bash
yarn typecheck
yarn lint
yarn build
```

Then test one instructor path locally and confirm:

- The instructor is not asked how many scenarios to review.
- The intro says 5 scenarios.
- Scenario pages show `Scenario 1 of 5` through `Scenario 5 of 5`.
- The instructor reaches `post-vignette-instructor` only after scenario 5.

Deploy after verification for the live survey to pick up the rollback.
