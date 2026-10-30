# Theme implementation

Use the shared `useAppTheme` hook from `@/theme/ThemeProvider` for all UI colors.
The hook exposes `colors`, `mode`, and `isDark`; `setMode` and `toggleMode` are
available for theme controls. Do not hard-code light or dark surface/text colors
in new screens or reusable components.

Use semantic palette roles:

- `background` for a page background, `surface` for cards and modal surfaces,
  and `surfaceSecondary` for subdued panels and controls.
- `text`, `textSecondary`, and `textMuted` for content hierarchy.
- `border` for dividers and outlines, `inputBackground` for fields.
- `primary` and `onPrimary` for prominent actions; `primarySurface` and
  `primaryText` for selected or informational accents.
- `danger`, `dangerSurface`, `success`, and `warning` for semantic feedback.
- `overlay` and `shadow` for modal backdrops and elevation.

For static `StyleSheet` styles, define a module-level style factory that accepts
`AppThemeColors`, then use `useThemeStyles(styleFactory)` in the component. This
shared hook recreates the styles when the selected scheme changes. Inline
styles can use `colors` directly. Keep colors that convey independent data
meaning (for example, user-selected calendar event colors) separate from theme
tokens.

The selected color scheme is persisted locally: SQLite on native platforms and
browser local storage on web.
