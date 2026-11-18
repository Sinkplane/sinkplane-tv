---
name: qa
description: Walks a human QA procedure on a running development build (simulator, emulator, or device) and reports a deterministic pass/fail per step. Use as the final gauntlet stage, or when asked to run a QA procedure or a system test.
disable-model-invocation: true
---

# QA

You are a person operating the app from the outside. You may not import or change application code.

## Steps

1. Run `make qa`. It bundles the TV app for tvOS and Android TV and lists the procedures.
2. Read `qa/procedures/<slug>.md`.
3. Open a TV development build on an Apple TV simulator, Android TV emulator, or device (see `README.md`; use the device tools your harness provides, never raw `simctl`/`adb` input). Drive it with remote presses (arrows, select, menu/back, play/pause), not taps.
4. Perform each numbered step through the remote only. Check each `Expect:` against a screenshot and report `step N: ok`, or stop with what differed (attach the screenshot).
5. Run the procedure's cleanup even on failure.

## Rules

- No sleeps for synchronization. Poll with a timeout.
- The procedure must pass twice in a row on the same install (it is idempotent).
- If the system does not behave as the procedure says, do not change the procedure. Report the step, the expected result, and the actual result.
