# Tandem (frontend)

Native macOS SwiftUI app. See [../docs/frontend.md](../docs/frontend.md) for the full stack and architecture.

## Prerequisites

- Xcode 26.x (Swift 6.3 language mode, macOS 14+ deployment target)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`) — the `.xcodeproj` is generated from [project.yml](project.yml) and is not committed to version control
- [SwiftLint](https://github.com/realm/SwiftLint) (`brew install swiftlint`)

## Getting started

```sh
xcodegen generate
open TandemApp.xcodeproj
```

Re-run `xcodegen generate` whenever `project.yml` changes (new target, new source group, etc.).

## Linting

```sh
swiftlint lint --strict
```

## Testing

```sh
xcodebuild test -project TandemApp.xcodeproj -scheme TandemApp -destination 'platform=macOS'
```
