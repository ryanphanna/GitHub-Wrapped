# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

### Changed

### Fixed

## [1.0.0] - 2026-03-01

### Added
- **Card Generation**: Initial release with a 1080×1920 PNG card rendered via Satori and Resvg.
- **Monthly Stats**: Commits, pull requests, and repos contributed fetched live from the GitHub REST API.
- **Top Language**: Automatically detected from the most-active repository for the selected month.
- **Top Repo**: Surfaced based on commit frequency across the month.
- **Month & Year Picker**: Support for any month across the current and previous two years.
- **Instant Download**: One-click PNG export with a filename scoped to the username, month, and year.
- **GitHub Token Support**: Optional `GITHUB_TOKEN` env variable to raise API rate limits from 60 to 5,000 requests/hour.
