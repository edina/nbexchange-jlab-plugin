# Contributing to nbexchange_jlab-plugin

We're delighted you want to contribute to this nbgrader exchange plugin.

## Opening an Issue

When opening a new Issue, please take the following steps:

1. Search GitHub and/or Google for your issue to avoid duplicate reports. Keyword searches for your error messages are most helpful.

1. If possible, try updating to master and reproducing your issue, because we may have already fixed it.

1. Try to include a minimal reproducible test case.

## Pull Requests

Some guidelines on contributing to nbexchange:

- All work is submitted via Pull Requests.
- Pull Requests should be submitted as soon as there is code worth discussing. Pull Requests track the branch, so you can continue to work after the PR is submitted. Review and discussion can begin well before the work is complete, and the more discussion the better. The worst case is that the PR is closed.
- Pull Requests should generally be made against `main`
- Pull Requests should be tested, if feasible:
  - bugfixes should include regression tests.
  - new behavior should at least get minimal exercise.
- New features and backwards-incompatible changes should be very clearly documented.

Github does a pretty good job testing the plugin and Pull Requests, but it may make sense to manually perform tests.

## Developing nbexchange_jlab

The plugins run python on the jupyter-server backend, and typescript in the jupyterlab frontend, so you will need
both Python and Node to work on the codeabse. The node version is defined in `.node-version`, and the main developers
of the system currently run under 3.12.

We suggest you set up an appropriate virtual environments.

In order to work in an actual jupyterlab notebook-server, the plugin requires to connect to a [NbExchange](https://github.com/edina/nbexchange)
service that should be setup and running before starting the jupyterLab notebook-server.

Please also check the [configuration section](README.md#configuration)

To setup nbexchange for development, run:

```bash
pip install .[test]
```

or

```bash
pip install -e '.[test]'
```

if zsh or similar

When writing code, please don't rely on _code is its own documentation_ - particularly if you're doing anything remotely complicated.
A simple comment at the top is useful for future developers to know _why_ the code is doing something.

### Formatting code.

We use [`pre-commit`](https://pre-commit.com/) to ensure consistency.

All (appropriate) files are checked with `isort`, `black`, and `flake8`.

## Running Tests

Tests should be run locally before final commit & Pull Request is made.

GitHub `Actions` run Tests. These teste include checking that files are _linted_ to our preferred styles:
[black](https://github.com/psf/black), [eslint](https://eslint.org/), and [prettier](https://github.com/pre-commit/mirrors-prettier)

When you add/change/improve functionality, please _please_ **please** write tests as well.

Tests should check that error cases are handled, that bad data does not break the system, and and that [where applicable] both singular & multiple actions are handled correctly.

When adding functionality that impacts both the `handlers` and the `plugin`, please try to use the outputs the `handler` tests check for in the _mocked_ `api_request` methods.

There is no such thing as _too many tests_

### Example testing process

This is how I test, using a virtual environment

```sh
pip install -r '.[test]'
pytest nbexchange
```

## Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the nbexchange-jlab directory
# Install package in development mode
pip install -e ".[test]"
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable nbexchange_jlab
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

## Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable nbexchange_jlab
pip uninstall nbexchange_jlab
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `nbexchange-jlab` within that folder.

## Testing the extension

### Server tests

This extension is using [Pytest](https://docs.pytest.org/) for Python code testing.

Install test dependencies (needed only once):

```sh
pip install -e ".[test]"
# Each time you install the Python package, you need to restore the front-end extension link
jupyter labextension develop . --overwrite
```

To execute them, run:

```sh
pytest -vv -r ap --cov nbexchange_jlab
```

### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

## Packaging the extension

Before making any Pull Requests, please ensure your code has been _linted_ in various ways

See [RELEASE](RELEASE.md)
