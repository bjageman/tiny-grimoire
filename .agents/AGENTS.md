# Workspace Rules

- When the user asks to PR changes, create a pull request on GitHub, poll status checks until they pass, and notify the user when it is ready. Do not automatically merge the PR. Do not create a PR unless the user explicitly asks to do so. Do not merge unless the user explicitly tells you to do so.
- Maintain files to be no larger than 1000 lines. If any files get larger than 1000 lines, assess if any code can be reduced/deleted without altering features, and split them into files that are no larger than 1000 lines. Try to prioritize keeping line counts below 500.
- Whenever a bug is fixed, add a unit test to reflect it if one doesn't exist already.
