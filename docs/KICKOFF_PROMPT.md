# Kickoff prompt for Claude Code

Paste this into Claude Code, opened at the root of a fresh clone of this repository.

---

You are building my personal website in this repository. Everything you need is already here except the code.

1. Read `CLAUDE.md`, then `docs/SPEC.md`, `docs/PLAN.md`, `docs/SCREENSHOTS.md` and `docs/DECISIONS.md`. Open `reference/prototype.html` in a browser and click through it: hero, spectrum rows, every object on the workbench, the PT/EN switch, the case-study panel, at 1440 px and at 390 px.
2. Before writing any code, send me (in European Portuguese) a short plan for Phase 0 and Phase 1, and every question you have about the spec. Recommend an answer for each question.
3. After I answer, implement Phase 0 and Phase 1 only. Commit in small, clear commits and push to `main` so the GitHub Action deploys.
4. Stop at the end of each phase with: what was done, how to see it, the checked boxes in `docs/PLAN.md`, open questions, and the missing content or screenshots you need from me.

Rules: copy only from `content/`; never invent facts about me; no placeholder links in production; I manage version numbers; targeted diffs when changing existing files; talk to me in Portuguese, write code and commits in English.
