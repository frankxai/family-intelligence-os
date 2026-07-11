# Page Spec

Page: German private family portal shell
Route: `/de/portal`
Brand: Family Intelligence OS reference implementation
Audience: Family members and human stewards
Primary task: Understand current access state and the family-circle model
Primary action: Authenticate through a future family-scoped provider; no action is offered until configured

## Outcome

Production fails closed without loading family data. Development may show a zero-record synthetic preview only when explicitly enabled. The user understands that privacy circles and review queues—not a social feed—organize the portal.

## First Read

What is this: A private German family knowledge and continuity workspace.
Who is it for: Personally invited family members and stewards.
Why now: The product kernel needs a reviewable portal surface before real intake.
Why different: Claims, evidence, consent, authority, and succession are visible states.
What should the user do: Wait for a personal invitation or inspect the synthetic preview in development.
Trust signal: Locked production state, no fake family records, no dead contact endpoint.

## Content Architecture

1. Access state and privacy seal.
2. Six family circles.
3. Zero-record steward queue.
4. Plain-language lock reason.

## Constraints

Dependencies: Existing Next.js, CSS, Lucide, and `@family/auth`.
Performance: Server component; no data call, image, video, or motion runtime.
Accessibility: German language region, semantic headings, focusable navigation, AA contrast.
Deployment: Production stays locked until a real family-scoped session adapter exists.
Out of scope: Credentials UI, invitations, real family names, analytics, database queries.

## Verification

Commands: monorepo typecheck and Vitest.
Screens: Locked production, desktop synthetic preview, mobile synthetic preview.
QA gates: Build and browser checks only after PP build/browser admission.
