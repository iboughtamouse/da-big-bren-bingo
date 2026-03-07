# Contributing

This project is small, but the goal is still to work like adults.

The point of this file is to define how humans and AI agents should collaborate here: challenge bad ideas when needed, keep work reviewable, and prefer tests that protect behavior instead of gaming coverage.

## Collaboration Expectations

- Suggestions are welcome from both sides.
- If a proposed change seems overcomplicated, brittle, unsafe, or misaligned with the product, say so.
- Pushback is useful when it comes with reasoning and a better option.
- The goal is not blind obedience. The goal is good decisions and fast iteration.

Good collaboration looks like this:

- explain tradeoffs clearly
- propose simpler alternatives when they exist
- call out risks before shipping
- execute decisively once the direction is clear

## Default Git Workflow

Do not default to working on `main`.

Preferred flow:

1. Start from an up-to-date `main`.
2. Create a feature branch for the task.
3. Make focused commits in logical chunks.
4. Open a pull request for review.
5. Merge after review and verification.

Branch naming does not need to be fancy. Simple names are fine:

- `feat/about-page-copy`
- `fix/board-validation`
- `chore/add-test-harness`

Commit messages should be short and descriptive. Conventional commits are fine, but not required.

## Pull Request Standard

PRs should be reviewable without archaeology.

Each PR should answer three questions:

1. What changed?
2. How was it verified?
3. What is still risky, deferred, or unverified?

If a diff is huge, that is usually a sign it should be split.

## Testing Philosophy

The target is not coverage for its own sake.

The target is confidence.

Good tests in this project should protect expected behavior and product invariants:

- board item validation rules
- deterministic shuffle behavior
- board ownership and authorization rules
- anonymous viewer access boundaries
- drawing persistence semantics
- routes and flows that are easy to regress during refactors

Bad tests in this project would be things like:

- asserting internal implementation details that can change freely
- snapshotting large chunks of noisy markup with little product value
- writing tests only because a coverage report says a line is uncovered
- duplicating the same assertion at multiple layers without a reason

When fixing a bug, the best test is usually one that fails before the fix and passes after it.

## Practical Testing Strategy

Right now there is not a full automated test suite in place, so use the lightest tool that gives real confidence.

Current baseline:

- client changes: `cd client && npm run lint` and `cd client && npm run build`
- backend or full-stack changes: targeted API or local smoke tests in addition to the above when relevant

As automated tests are added, prioritize these first:

1. Pure logic with clear invariants, especially shuffle and validation helpers.
2. Route-level tests for auth, ownership, and data exposure.
3. A small number of high-value UI tests for the create/edit/play flows.

Prefer a few high-value tests over a broad pile of fragile ones.

## What AI Agents Should Optimize For

Agents working in this repo should:

- challenge weak assumptions when there is a concrete reason
- preserve the existing product model unless asked to change it
- keep client and server validation aligned
- avoid direct pushes to `main` by default
- favor small, reviewable diffs
- verify changes instead of hand-waving

Agent instructions also live in [AGENTS.md](AGENTS.md).