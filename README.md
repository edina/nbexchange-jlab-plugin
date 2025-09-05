# NbExchange JupyterLab Plugin

[![Github Actions Status](/workflows/Build/badge.svg)](/actions/workflows/build.yml)

A JupyterLab extension for [NbExchange](https://github.com/edina/nbexchange).
This extension is providing [nbgrader](https://github.com/jupyter/nbgrader) plugins design to use the NbExchange service.

It is composed of a Python package named `nbexchange_jlab` for the server extension 
and a NPM package named `nbexchange_jlab` for the frontend extension.

## Requirements

- JupyterLab >= 4.0.0

## Installation

Installing this plugin in a jupyter notebook will automatically install nbgrader.
This version installs `nbgrader`  0.9.5 (which makes it compatible with JupyterLab & Notebook 7)

This extension can be directly install from github:

```bash
pip install https://github.com/edina/nbexchange_jlab_plugin/archive/refs/tags/v0.2.2-beta.tar.gz
```

or from this cloned repository:

```bash
pip install nbexchange_jlab
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall nbexchange_jlab
```

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```

## Configuration

### Environment

NbExchange is using a couple of environment variable to know how to connect with the [NbExchange service](https://github.com/edina/nbexchange)

```bash
export NAAS_BASE_URL="http://localhost:9000/"
export NAAS_COURSE_ID="My Course"
```

If you are using [mise](https://mise.jdx.dev/) make sure the right values are in the `mise.toml` file.

### Nbgrader configuration

Configuring `nbgrader` to use the alternative exchange in Jupyterlab/Jupyter-Notebook

The primary reference for this should be the [nbgrader documentation](https://nbgrader.readthedocs.io/en/stable/configuration/nbgrader_config.html)
This repository contain a config file example: `nbgrader_config.py`.
It basically needs to include the following line:

```python
c.ExchangeFactory.exchange = 'nbexchange_jlab.plugins.Exchange'
c.ExchangeFactory.list = 'nbexchange_jlab.plugins.ExchangeList'
c.ExchangeFactory.release_assignment = 'nbexchange_jlab.plugins.ExchangeReleaseAssignment'
c.ExchangeFactory.fetch_assignment = 'nbexchange_jlab.plugins.ExchangeFetchAssignment'
c.ExchangeFactory.submit = 'nbexchange_jlab.plugins.ExchangeSubmit'
c.ExchangeFactory.collect = 'nbexchange_jlab.plugins.ExchangeCollect'
c.ExchangeFactory.release_feedback = 'nbexchange_jlab.plugins.ExchangeReleaseFeedback'
c.ExchangeFactory.fetch_feedback = 'nbexchange_jlab.plugins.ExchangeFetchFeedback'
```

These plugins will also check the size of _releases_ & _submissions_

`c.Exchange.max_buffer_size = 204800  # 200KB`

[or even a more specific `c.ExchangeSubmit.max_buffer_size = 204800  # 200KB`]

By default, upload sizes are limited to 5GB (5253530000)
The figure is bytes

## Contributing

See [Contributing.md](CONTRIBUTING.md) for details on how to extend/contribute to the code.
