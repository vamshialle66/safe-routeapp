<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- The frontend talks to an optional external SafeRoute Express backend via src/lib/saferouteApi.ts; unreachable custom servers fall back to the authenticated built-in Google engine, not synthetic data, so real searches remain honest.
- Maps use Leaflet loaded only in the browser through src/components/map/RouteMap.tsx — Leaflet breaks during server rendering.
- Live route/place scoring uses authenticated engine.functions.ts and engine.server.ts Google connector calls; liveDataPolicy rejects failed real searches and demoAnalysis is invoked only through explicit example actions, preventing fabricated navigation results.
- Signed-in users' trips, saved routes, profile and emergency contacts live in Lovable Cloud tables (RLS: own rows only); src/lib/analysisStore.ts keeps localStorage as the device cache and syncs to the account on sign-in (src/routes/__root.tsx listener) — signed-out use still works device-only.
- Keep expanded route assessment in the browser-safe routeAssessment module, separate from the legacy open-percentage score; persist its versioned evidence with each route and exclude unknown factors rather than fabricating them, so old trips remain readable and recommendations remain explainable.
- Require account authentication for built-in Google Routes and Places calls, preserving bounded batches and caches, because those connector requests are billable; signed-out real searches ask for sign-in rather than substituting examples.
- Never auto-seed dashboard journeys or notifications; display saved lookup timestamps and keep example paths out of navigation actions, because stored results are not continuous real-world monitoring.
- Community concerns are AI-classified via authenticated server functions; reviewers (user_roles admin/moderator, checked server-side via has_role) approve them through a security-definer function, and approved tips are exposed only through a projection without reporter or original text, never as route-score inputs, because AI classification and review are not event verification.
- Persist AI access/billing blocks in the server-only ai_feature_state table; only an explicit owner action after restored access may clear them, preventing automatic billed retries across restarts.
- Curated Mumbai police evidence uses privileged offline imports with original-document hashes and source locators; ordinary users have reviewed-read access only, because community reports and AI extraction are not verification.
- Crime matching uses Turf geometry against whole-route reporting coverage and dated street coordinates; incomplete, stale, oversized or failed queries never change scores, because sparse report collections cannot establish comparative crime rates.
- Attach the attributed, boundary-filtered Mumbai streetlight snapshot as persisted location-only evidence through the authenticated engine; match real route pieces separately and never score lamp inventory as illumination, because mapped assets do not establish operational lighting.
- Keep fake-call simulation in a root-level browser-only interaction provider with user-initiated local audio and cleanup on answer/end/unmount; this makes immediate access available everywhere without microphone access or actual calls.
