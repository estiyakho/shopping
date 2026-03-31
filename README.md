# View Due

`View Due` is a local-first task manager built with Expo, React Native, and Expo Router. It helps users organize todos into categories, review progress by date, and track completion trends from a mobile-friendly tabbed interface.

## What The App Does

The app is centered around five main screens:

- `Categories`: create and browse task categories, search them, and view progress per category.
- `All Todos`: add tasks from an in-place popup, filter by status, filter by category, search by title, and sort the list.
- `Calendar`: review tasks by day in a month view.
- `Statistics`: see totals, completion rate, weekly activity, hourly activity, and streaks.
- `Settings`: change appearance and app preferences, use an expanded accent color picker with shade selection, and reset data, stats, or settings.

All app data is stored locally on the device using `AsyncStorage` through a persisted Zustand store. The current project does not require a backend.

## Current Feature Set

- Add and delete todos
- Mark todos as `Doing` or `Done`
- Create tasks and categories from modern in-place popups instead of separate pages
- Create custom categories with user-selectable colors and icons
- Search categories and todos
- Sort todos by newest, oldest, title A-Z, or title Z-A
- View category completion progress
- View tasks on a calendar screen
- Track statistics such as total tasks, today, this week, completion rate, and streaks
- Customize theme, AMOLED mode, accent color, time format, first day of week, default screen, and language
- Pick from expanded color families with a separate shade row in settings and category creation
- Use the current theme accent color as the default starting color for new categories
- Reset app data, statistics baseline, or settings from inside the app

## Platform And Build Details

- Framework: Expo SDK `54`
- React Native: `0.81.5`
- React: `19.1.0`
- Routing: `expo-router`
- State management: `zustand`
- Local persistence: `@react-native-async-storage/async-storage`
- App version: `1.0.0`
- Orientation: portrait only
- New React Native architecture: enabled
- Typed routes: enabled
- React Compiler experiment: enabled

### Android

- Android support is enabled in the Expo config
- Adaptive icon assets are configured
- Edge-to-edge mode is enabled
- Predictive back gesture is disabled
- No explicit `minSdkVersion` is set in `app.json`
- Expo SDK `54` supports Android `7+`
- Expo SDK `54` targets Android API `36`

### iOS

- iOS support is enabled
- `supportsTablet` is set to `true`
- Expo SDK `54` supports iOS `15.1+`
- No custom bundle identifier is configured yet

### Web

- Static web output is enabled
- Custom favicon is configured

## Project Notes

- The app currently uses local device storage only
- There is no authentication or remote sync in the current codebase
- The package name / store identifiers are not configured yet for production publishing
- Some settings exist for future-facing preferences, but the app today is mainly focused on local task organization and tracking

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the Expo development server:

```bash
npm start
```

3. Run on a target platform:

```bash
npm run android
npm run ios
npm run web
```

## Project Structure

- `app/`: screens and Expo Router routes
- `components/`: reusable UI building blocks
- `store/`: persisted Zustand task store
- `types/`: app data types
- `utils/`: defaults, date helpers, reset logic, layout helpers, and shared color palettes
- `assets/`: icons, splash, and image assets
