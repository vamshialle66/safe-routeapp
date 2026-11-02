# Fake call improvements

# Academic synopsis
- [x] Complete 30 pages using the college template, student names, and guide.
- [x] Verify all pages and deliver editable Word and PDF copies.

- [x] Add ringing audio and a realistic incoming/answered call screen.
- [x] Add immediate Fake call access across the app, independent of Emergency.
- [x] Verify ringing, answer/end cleanup and phone/desktop layouts.

# Mumbai street lighting

- [x] Verify a real Mumbai streetlight source, its dates and coverage.
- [x] Connect usable lighting evidence without treating lamp locations as working lights.
- [x] Verify evidence matching and public wording (real route matched 14 lamps; 22 tests passed).
- [ ] Lighting score: blocked on trustworthy dated working-light or measured-illumination data and a validated methodology; mapped poles alone cannot supply this.

# SafeRoute feature batch

- [x] Fake call screen
- [x] Shareable route summary
- [x] 24/7 safe spots filter on Around Me
- [x] Rate a route after walking it
- [x] Departure time picker
- [x] Check-in timer on Emergency page
- [x] Offline emergency card note
- [x] Most reported areas list

# Live trip sharing

- [x] shared_trips table + RLS (owner writes, anyone with link reads) + realtime
- [x] Server functions: start/update/end trip, public fetch by share code
- [x] "Share live trip" from route details + Emergency page
- [x] Live trip page for the sharer (GPS tracking, share link, arrived/end)
- [x] Public watcher page /trip/:code (live map, status, no login)
- [x] Verified end-to-end: start → watch signed-out → live position on map

# Installable app + route-matched tips

- [x] App icon, favicon, manifest (Add to Home Screen, PWA manifest-only)
- [x] Head tags: theme-color, apple-touch-icon, manifest
- [x] community_alerts latitude/longitude columns + route-matched list_community_tips RPC
- [x] Map pin picker when reporting a concern (optional, along the route)
- [x] Tips section shows only tips pinned along the planned route
