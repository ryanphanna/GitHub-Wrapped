# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-03-03

### Added
- **User Profile**: Card now displays the user's avatar and full name for a personal touch.
- **Rich Stats**: Added total star count (across top 100 repos) and follower count to the card.
- **Theming**: Integrated theme support with three selectable styles: Midnight, Gold, and Cyberpunk.
- **Social Sharing**: One-click sharing buttons for X (Twitter) and LinkedIn.

### Changed
- **Card Layout**: Reorganized stat cards to accommodate new data points gracefully.
- **Download Filename**: Filenames for downloaded cards are now theme-aware.

## [1.1.0] - 2026-03-02

### Changed
- **Card background**: Replaced flat `#0d1117` with a subtle dark-to-green-tinted gradient.
- **Card accent bar**: Added a 6px green stripe pinned to the top edge of the card.
- **Commits section**: Added a left green border accent; "commits this month" label now renders in soft green instead of gray.
- **Secondary stats**: PR and repos stats are now displayed in rounded bordered cards instead of a bare divider layout.
- **Top Language**: Language name now renders in its own language colour; section styled as a bordered card.
- **Top Repo**: Section styled as a bordered card to match the language section.
- **Web UI background**: Added a radial green glow gradient at the top of the page.
- **Form card**: Added depth shadow for better visual hierarchy.
- **Generate button**: Replaced flat colour with a diagonal green gradient.
- **Card preview**: Added a green ambient glow shadow around the generated card preview.

## [1.0.0] - 2026-03-01

### Added
- **Card Generation**: Initial release with a 1080×1920 PNG card rendered via Satori and Resvg.
- **Monthly Stats**: Commits, pull requests, and repos contributed fetched live from the GitHub REST API.
- **Top Language**: Automatically detected from the most-active repository for the selected month.
- **Top Repo**: Surfaced based on commit frequency across the month.
- **Month & Year Picker**: Support for any month across the current and previous two years.
- **Instant Download**: One-click PNG export with a filename scoped to the username, month, and year.
- **GitHub Token Support**: Optional `GITHUB_TOKEN` env variable to raise API rate limits from 60 to 5,000 requests/hour.
