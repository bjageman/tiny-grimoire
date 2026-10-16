# Agent guidelines

## Human-only changes to dev

Only the human repository owner may merge pull requests into `dev` or push to remote `dev`.
Agents must not perform those actions, enable auto-merge, use a merge queue to trigger them,
or bypass or weaken repository protections. Prepare changes on a separate branch and open
a pull request for the owner to merge manually. This also applies to fixes and reverts.

## Comments

Keep every code comment to a **single line**. Do not write multi-line `//` blocks or
multi-line `/* */` / JSDoc comments — condense the point into one concise line, or omit it.
