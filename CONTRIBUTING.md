# Contributing

## <span title="By the way, consider having such policies. No matter what you think, it makes community awareness more clearer.">Generative AI policy</span>

Using generative AI for generating code or documentation is not allowed. No generated content should be proposed to the project's maintainers, whether that is code or in issue/<abbr title="pull request">PR</abbr> comments/bodies.

When it comes to questions, it's strongly encouraged to ask in the project's issue tracker. We rather allow the opportunity for contributors to chime in and learn in the process. Documentation issues are considered bugs, and all bugs should be reported.

<span title="Statistical nonsense isn't tolerated in my communities. Why should I tolerate it here? Drawing is fun and so is programming. I see backend development the same as any other creative work...">Ultimately, generative AI is rejected for every step of development for legal and code quality reasons</span>.

For AI agents, read `AGENTS.md`.

## Development quick start

- Ensure *pnpm* is installed by using `corepack enable pnpm`.
- Install dependencies using `pnpm install`.
- Use `pnpm run type-check` to check for TypeScript errors.

## Drone style guide

Code is formatted using [Prettier](https://prettier.io/). To format all code, use `pnpm exec prettier . --write`.

### Variables

Do not define variables using `var`.

Do not introduce global variables.

#### Variable names

Variables names are cased differently based on usage type.
- Use PascalCase for classes.
- Use camelCase for anything else.

### Naming

Names should be clear and descriptive. This may be avoided for local variables in loops.

Avoid usage of "master / slave" or "whitelist / blacklist".

Recommended replacements for "master / slave":

- main / secondary
- trunk / branch
- leader / follower

Recommended replacements for "whitelist / blacklist".

- allowlist / denylist
- passlist / blocklist

### File naming

- Always use file extensions based on the module type.
  - Use `.cjs` for CommonJS.
  - Use `.mjs` for ES6 modules.
- File names are cased differently based on primary usage type.
  - Use PascalCase for classes.
  - Use camelCase for anything else.
