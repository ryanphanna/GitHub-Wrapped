# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-03-09

### Added
- **Heat Map**: Added "Contribution Intensity" grid to the card, visualizing daily commit activity for the month.
- **Daily Commits Data**: Updated stats fetching to include buckets for daily commit counts.
- **Story Sharing**: "Post to Stories" button using the Web Share API for direct sharing to Instagram/Facebook Stories on mobile. Falls back to download on desktop.
- **Threads Sharing**: Dedicated share button with intent URL for Threads.
- **WhatsApp Sharing**: Dedicated share button with intent URL for WhatsApp Status.
- **Copy Link**: One-click "Copy Link" button with visual "Copied!" feedback for easy link-sticker usage.
- **Two-Stage UI**: Form interactions are now divided into two distinct steps for progressive disclosure: first finding the profile, then revealing customization options.
- **Demo Mode**: The application now instantly loads with a pre-generated demo card (using the developer's profile) to showcase functionality on initial mount without empty placeholders.

### Changed
- **Theme Picker Redesign**: Replaced the standard dropdown with a premium 2x2 grid of visual "template cards" showing theme gradients and colors.
- **Compact Layout**: Significantly reduced vertical spacing ("zero-scroll" design) across headers, forms, and the action grid for a more premium, dashboard-like feel.
- **Card Preview Sizing**: Aggressively scaled the card preview to `72vh` to ensure it fits perfectly within standard viewports without bottom cutoffs.
- **Card Typography Scaling**: Re-balanced the internal card typography (larger avatar, larger names, re-proportioned primary stats, smaller heatmap) to eliminate excess white space.
- **Action Grid Positioning**: Moved the Share/Download action grid from the right column to below the form in the left column for better workflow.
- **Page Layout**: Migrated from a narrow single-column centered layout to a responsive 12-column CSS grid.
- **Control Sizing**: Tuned buttons, gradients, and font sizing to a sleeker, minimalistic standard across the page.
- **Card Layout**: Completely refactored the image layout, squeezing bottom statistics tightly to fit the new calendar-scale heatmap at full width.
- **Heatmap Layout**: Updated the calendar-scale heatmap to an exact 7x5 week/day matrix layout to match the GitHub contributions graph perfectly.
- **Animation**: Removed the slide-up component animation from the card preview for a snappier feel.
- **Action Visibility**: Share/Download action buttons are now strictly hidden until a user successfully generates their own customized card.

### Fixed
- **API Cache Invalidated**: Solved an image caching ghost bug where Next.js aggressive Server Components optimization was locking old API generation renders.
- **API Pagination Limits**: Fix limit missing heatmap data by aggressively paginating to fetch up to 500 github commits (5 API requests/pages deep max).
- **SSR Error**: Added `typeof window !== 'undefined'` guard around `window.location.href` to prevent server-side rendering crashes.
- **Heatmap Empty Colors**: Fixed empty heatmap squares blending into the card background by giving them the correct #2d333b gray base, making the grid shape properly distinct.

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
