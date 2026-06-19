# Workspace Rules

- When the user asks to PR changes, create a pull request on GitHub, poll status checks until they pass, merge the PR, switch back to main, and pull the latest changes.
- Maintain files to be no larger than 1000 lines. If any files get larger than 1000 lines, assess if any code can be reduced/deleted without altering features, and split them into files that are no larger than 1000 lines. Try to prioritize keeping line counts below 500.
