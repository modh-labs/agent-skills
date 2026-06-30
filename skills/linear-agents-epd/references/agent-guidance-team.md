# Agent Guidance, Team level (paste-in)

Paste into the **team's** AI / Agent settings (Team Settings → AI & Agents / Triage → Agent behavior).
Team guidance **overrides** workspace guidance when both exist, so keep this to team-specific routing
and conventions; don't repeat the workspace rules. One file per team, fill the brackets.

---

## Team: `<TEAM KEY>`, <Team name>

### Ownership lanes (route to the right person)
Suggest the assignee by lane, but leave assignment to a human unless a Triage Rule says otherwise:
- **<Area(s)>** → <person> (e.g. data/pipeline)
- **<Area(s)>** → <person> (e.g. UI/dashboard)
- **<Area(s)>** → <person> (e.g. AI)
- Unsure → leave unassigned in Triage and post an `elicitation`.

### Triage behavior for this team
- On a new Triage issue: suggest Type + Area + Complexity labels and flag likely duplicates.
- If the issue is missing repro steps / expected-vs-actual / affected account, **post a clarifying
  comment** and keep it in Triage (don't accept it).
- Translate non-English customer reports to English in a comment, preserving the original.
- Attach the relevant doc/runbook when one obviously applies.

### Cycle / planning conventions
- Cadence: <n>-week cycles. Capacity comes from the last 3 cycles' velocity, don't over-fill.
- Estimates: [enabled? scale?]. Suggest an estimate but don't set it on committed issues without a human.
- Stale issues: flag issues untouched for <n> days; propose roll-over, don't force it.

### Definition of "started" / done
- On pickup, move the issue to **In Progress** (first `started` state). Never jump to In Review/Done.
- "Done" is a **human** action for this team.

### Surfaces this team uses
- Slack channel: <#channel>. Project channels: link updates there as drafts.
- GitHub repo(s): <repo>. PRs from agents must open as **draft**.
