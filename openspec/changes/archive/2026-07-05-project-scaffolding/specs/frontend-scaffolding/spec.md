## ADDED Requirements

### Requirement: Frontend project structure
The `frontend/TandemApp` directory SHALL contain a SwiftUI macOS application project (Swift 6.1 language mode, macOS 14+ deployment target) with the folder structure defined in `docs/frontend.md` §8 (`App/`, `Features/`, `Networking/`, `Models/`, `Common/`, plus `TandemAppTests/` and `TandemAppUITests/` targets).

#### Scenario: Folder structure matches the documented layout
- **WHEN** `frontend/TandemApp/` is inspected
- **THEN** it contains the `App/`, `Features/`, `Networking/`, `Models/`, and `Common/` directories, with `Features/` containing empty subdirectories for each feature area named in `docs/frontend.md` §8

### Requirement: Frontend application builds and launches
The macOS application SHALL build successfully in Xcode and launch to a placeholder window, proving the project configuration (target, signing settings for local builds, deployment target) is correct.

#### Scenario: App builds from a clean checkout
- **WHEN** `xcodebuild build` is run against the `TandemApp` scheme on a machine with the required Xcode version
- **THEN** the build succeeds with no errors

#### Scenario: App launches to a placeholder window
- **WHEN** the built app is run
- **THEN** a single window opens showing placeholder content (no crash, no real feature screens yet)

### Requirement: Frontend lint configuration
The project SHALL include a SwiftLint configuration enforcing the team's style conventions, runnable both locally and in CI.

#### Scenario: SwiftLint runs cleanly on the scaffolded project
- **WHEN** `swiftlint` is run against `frontend/TandemApp`
- **THEN** it completes with no violations on the initial scaffolded code

### Requirement: Frontend CI pipeline
A GitHub Actions workflow SHALL validate every push and pull request that touches `frontend/`, running SwiftLint, a build, and the test targets on a macOS runner.

#### Scenario: CI runs on a frontend pull request
- **WHEN** a pull request modifies a file under `frontend/`
- **THEN** `.github/workflows/frontend-ci.yml` runs on a `macos-latest` runner, selects the required Xcode version, runs SwiftLint, builds the app, and runs `TandemAppTests`/`TandemAppUITests` via `xcodebuild test`, reporting a single pass/fail status

#### Scenario: CI is skipped for unrelated changes
- **WHEN** a pull request only modifies files outside `frontend/`
- **THEN** `frontend-ci.yml` does not run
