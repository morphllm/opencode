<p align="center">
  <a href="https://docs.morphllm.com">
    <picture>
      <source srcset="packages/web/src/assets/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/web/src/assets/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/web/src/assets/logo-ornate-light.svg" alt="morphcli logo">
    </picture>
  </a>
</p>
<p align="center">AI coding agent with Morph Fast Apply integration.</p>
<p align="center">
  <a href="https://opencode.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/opencode-ai"><img alt="npm" src="https://img.shields.io/npm/v/opencode-ai?style=flat-square" /></a>
  <a href="https://github.com/sst/opencode/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/sst/opencode/publish.yml?style=flat-square&branch=dev" /></a>
</p>

https://docs.morphllm.com
This repo is based on the opencode repo and its brilliant contributiors!
---

### Installation

```bash
# Package managers
npm i -g morphcli@latest        # or bun/pnpm/yarn
bun install morphcli@latest
yarn global add morphcli@latest
pnpm add -g morphcli@latest
```

#### Quick Start

Set your API keys and run the Morph integration:

```bash
ANTHROPIC_API_KEY="your-claude-key" MORPH_API_KEY="your-morph-key" morphcli run
```

### Morph Fast Apply (Optional)

For faster, more accurate code edits, opencode can integrate with [Morph](https://morphllm.com) - an AI model specialized for code merging at 4500+ tokens/second with 98.8% accuracy.

```bash
# Enable Morph Fast Apply
export MORPH_API_KEY=your_api_key
```

When enabled, opencode's edit tool automatically uses Morph's intelligent code merging instead of search-and-replace, supporting multiple edits and `// ... existing code ...` syntax.

### Documentation

For more info on how to configure morphcli and Morph Fast Apply [**head over to the docs**](https://docs.morphllm.com/quickstart).

### Development

To run morphcli locally you need:

- Bun
- Node.js/TypeScript

And run:

```bash
$ bun install
$ bun dev
```

#### Development Notes

**Morph Integration**: This CLI integrates with Morph Fast Apply API for intelligent code merging. See `agent-instruction.txt` for integration details.

### Features

#### Morph Fast Apply Integration

- **Intelligent Code Merging**: Replace full file rewrites with Morph's 4500+ tokens/second merging
- **Batch Processing**: Non-interactive mode for automation
- **File-based Instructions**: Read prompts from `agent-instruction.txt` by default
- **Provider Agnostic**: Works with Claude, OpenAI, and other providers

#### Key Capabilities

- **Smart Editing**: Uses `// ... existing code ...` syntax for precise edits
- **Error Handling**: Robust error collection and reporting
- **Flexible Input**: Command line args, stdin, or file input
- **Terminal Focused**: Built for CLI workflows and automation

---

**Learn more** [Morph Docs](https://docs.morphllm.com) | [Fast Apply Guide](https://docs.morphllm.com/quickstart)
