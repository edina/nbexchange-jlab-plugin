# NbExchange JupyterLab Extensions

This directory contains separate JupyterLab extensions for NbExchange functionality. Each extension can be enabled or disabled independently.

## Extensions

### @jupyter/nbexchange-history

Provides the Exchange History page showing all interactions with the exchange service.

**Plugin ID:** `@jupyter/nbexchange:history`

### @jupyter/nbexchange-bulkautograde

Provides the Bulk Autograding page for managing assignment submissions.

**Plugin ID:** `@jupyter/nbexchange:bulkautograde`

## Enabling/Disabling Extensions

Each extension can be enabled or disabled independently using the `jupyter labextension` command:

### Disable an extension

```bash
# Disable history extension
jupyter labextension disable @jupyter/nbexchange:history

# Disable bulk autograde extension
jupyter labextension disable @jupyter/nbexchange:bulkautograde
```

### Enable an extension

```bash
# Enable history extension
jupyter labextension enable @jupyter/nbexchange:history

# Enable bulk autograde extension
jupyter labextension enable @jupyter/nbexchange:bulkautograde
```

### Check extension status

```bash
jupyter labextension list
```

## Building

To build all extensions:

```bash
# From the root directory
jlpm build
```

To build individual extensions:

```bash
# Build history extension
cd packages/history
jlpm build

# Build bulk autograde extension
cd packages/bulkautograde
jlpm build
```

## Development

For development with hot-reload:

```bash
# From the extension directory
jlpm watch
```
