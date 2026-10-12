# Design system

## Direction

Scholar Harbor uses **Calm Academic + Editorial Minimalism + Soft Structure**.
It should feel like a refined research publication and personal reading space,
with papers dominating the hierarchy. Avoid dashboard density, decorative
metrics, nested cards, and attention-seeking motion.

Phase 01 implements these tokens in `src/styles/global.css`. Phase 02 extends the
same vocabulary to discovery modes, filter controls, dense paper cards, local
state controls, and the paper-detail metadata sidebar. Later phases should
continue using semantic tokens rather than introducing page-specific colors.

The reusable Phase 01 component set includes `SiteHeader`, `SiteNavigation`,
`PageContainer`, `SectionHeader`, `FeaturedPaperCard`, `CompactPaperCard`,
`NewsPreviewCard`, `TopicBadge`, `ResearchPulsePanel`, `EmptyState`,
`LoadingState`, `ErrorState`, and `DataFreshnessIndicator`.

Phase 02 adds the reusable interactive `BookmarkButton`; both paper-card variants
now consume the normalized Paper type and preserve the Phase 01 visual language.

## Semantic color tokens

| Token                  | Light value | Intended use              |
| ---------------------- | ----------- | ------------------------- |
| `--color-canvas`       | `#F7F6F2`   | page background           |
| `--color-surface`      | `#FFFFFF`   | primary surface           |
| `--color-surface-soft` | `#EBF0EB`   | quiet grouping            |
| `--color-primary`      | `#718B80`   | brand/supporting controls |
| `--color-action`       | `#426957`   | primary actions           |
| `--color-explore`      | `#879DB5`   | exploratory discovery     |
| `--color-text`         | `#303C39`   | main text                 |
| `--color-text-muted`   | `#6F7E77`   | secondary text            |
| `--color-border`       | `#E3E8E2`   | subtle boundaries         |
| `--color-warm`         | `#B8A58E`   | restrained warm accent    |

Components consume semantic tokens rather than literal colors. Token use still
requires contrast checks; a provided value is not automatic proof of WCAG AA.
Dark-theme tokens must be designed and tested before dark mode is called
supported.

## Typography

- Newsreader is reserved for selected editorial headings.
- Inter or an equivalently readable sans serif serves navigation, paper titles,
  metadata, and controls.
- Include a suitable system Chinese fallback stack.
- Body text: 15–16 px with approximately 1.6–1.7 line height.
- Paper-card title: 17–19 px.
- Paper-detail title: 28–34 px on desktop, responsively reduced.
- Adaptive page shell: approximately 1160 px on standard desktops, growing
  continuously to approximately 2200 px on ultra-wide displays.
- Long-form reading width: approximately 720–780 px.

Avoid tiny metadata, excessively light weights, long all-caps labels, and clipped
paper titles or author lists.

## Layout modes

- **Home:** editorial composition with a small number of selected feature areas.
- **Paper list:** compact enough for research scanning while retaining readable
  titles, authors, dates, tags, and recommendation reasons.
- **Paper detail:** spacious single-column reading flow with an optional secondary
  metadata area at wider viewports.

Use a consistent spacing scale, generous whitespace, subtle borders, modest corner
radii, and little or no shadow. Every surface must work at desktop, tablet, and
mobile widths.

## Interaction and accessibility

- Use semantic HTML before adding ARIA.
- All controls work with a keyboard and expose visible focus.
- Icon-only controls require accessible names.
- Hover cannot be the only way to reveal required information.
- Respect `prefers-reduced-motion`; avoid autoplay and distracting animation.
- External links use safe `target`/`rel` behavior and clearly indicate their
  destination.
- Preserve list filters and browsing context across list/detail navigation.
- Provide genuine loading, empty, stale, error, and missing-data states.
- Avoid infinite feeds without a natural stopping point.

Target WCAG 2.2 AA where practicable and verify contrast and interaction in tests
rather than assuming token choices are sufficient.
