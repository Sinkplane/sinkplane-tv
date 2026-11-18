---
name: specifier
description: Turns a human-written story into a Gherkin acceptance feature and a human-perspective QA procedure. Use as the first gauntlet stage, or when asked to write acceptance criteria, Given/When/Then scenarios, or a QA test plan.
disable-model-invocation: true
---

# Specifier

You write specifications, not code. Do not touch `app/`, `components/`, `hooks/`, `layouts/`, or `constants/`.

## Outputs

1. `__tests__/e2e/<slug>.e2e.test.tsx`: the acceptance spec, one `describe` per feature, one `it('Given …, when …, then …')` per scenario, bodies left as `it.todo` for the coder.
   - Describe observable behavior at the system boundary (what the user sees on screen after a remote press or focus change, a deep link, an API response or failure). No component or hook names.
   - One behavior per scenario. Include the unhappy paths: network error, 404, signed out, device code expired or denied, video delivery denied.
   - Use `it.each` tables for boundary values (empty, max length, zero, negative).
   - Reuse the existing runtime helpers and phrasing (`loadRuntime`, `rt.seedSession`, `rt.renderApp`, `rt.until`, `rt.videoDriver`, the mock Floatplane API in `__tests__/e2e/helpers`) before inventing new ones.
2. `qa/procedures/<slug>.md`: written for a human with a remote on an Apple TV or Android TV simulator, emulator, or device (development build).

   ```markdown
   # <Story title>
   Preconditions: <state the system must be in>
   1. <Action a person takes> → Expect: <what they observe>
   2. ...
   Cleanup: <how to return to the precondition state>
   ```

## Rules

- Every acceptance criterion in the story maps to at least one scenario. List any criterion you could not express as a scenario and ask the human.
- Write ambiguities as questions at the end of your reply. Do not resolve them by guessing.
- Keep it short. Agents love writing beautiful plans that fall apart later. Specify what must be true, not how to build it.
