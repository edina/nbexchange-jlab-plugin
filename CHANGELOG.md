# Changelog

<!-- <START NEW CHANGELOG ENTRY> -->

## 2.0.6

### Enhancements made

- Removed the `CourseList` class from Exchange History code, added loading spinner, and hid empty entries for students (#33)
- Improved history page color scheme for light/dark modes (#33)

### Bugs fixed

- Fixed history call timeout issues (#33)

### Maintenance and upkeep improvements

None

## 2.0.5

### Enhancements made

None

### Bugs fixed

- Fixed broken duedate handling when `DueDate` is `None` (#30)
- Added test for malformed duedate values

### Maintenance and upkeep improvements

None

## 2.0.4

### Enhancements made

None

### Bugs fixed

- Fixed markdown rendering issues (#28)
- Removed custom alert CSS and reverted to standard alert classes

### Maintenance and upkeep improvements

None

## 2.0.3

### Enhancements made

None

### Bugs fixed

- Fixed duedate and feedback time type mismatches (#26)

### Maintenance and upkeep improvements

- Updated Yarn to 24.9.0
- Removed duplicate version spec from pyproject.toml
- Removed authors field from pyproject.toml

## 2.0.2

First working version of nbexchange_jlab_plugin tested locally and on the kubernetes cluster.

### Enhancements made

- Moved NbExchange plugin from [NbExchange service](https://github.com/edina/nbexchange) to this JupyterLab Extension
- Added History Page with download/collect functionality
- Added bulk autograder functionality with UI (#20)
- Added due-date handling to collect plugin
- History page now uses exchange package (#10)
- Abstracted exchange auth connection (#14)
- Added error handling for client-side (#16)
- Remove old `Nbgrader` menu and replace it with similar one to add the `Exchange History` command that open History page

### Bugs fixed

None

### Maintenance and upkeep improvements

- Added pytest test suite and updated documentation
- Added pre-commit hooks and updated CONTRIBUTING.md
- Updated Node.js to version 20
- Added `standard-pkg-resources` to test dependencies
- Updated .gitignore for hatchling version file handling

<!-- <END NEW CHANGELOG ENTRY> -->
