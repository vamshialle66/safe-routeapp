# Mumbai streetlight evidence

## Connected data

The built-in authenticated route engine attaches a location-only OpenStreetMap inventory. It does **not** change route scores or claim lighting accuracy.

- 76 `highway=street_lamp` nodes inside BMC's 24 ward polygons (668 in the wider bounding box, with non-Mumbai nodes excluded).
- Retrieved: 2026-10-18. The service returned an OSM base snapshot dated **2026-07-15T15:22:01Z**, not current operational data.
- Source: https://overpass.kumi.systems/api/interpreter
- Query: `[out:json][timeout:15];node[highway=street_lamp](18.85,72.7,19.55,73.15);out meta;`
- Boundary source: https://services8.arcgis.com/r6MmJtuWAzMawmJ8/ArcGIS/rest/services/BMC_Ward/FeatureServer/0
- Boundary download: `/query?where=1%3D1&outFields=NAME&returnGeometry=true&outSR=4326&f=geojson` appended to the layer URL.
- Attribution: © OpenStreetMap contributors, ODbL 1.0: https://www.openstreetmap.org/copyright
- Source-response SHA-256 recorded in `src/data/mumbai-streetlights.json`; only node IDs, coordinates and map-edit timestamps retained, not contributor identities.

Matching uses Turf's point-to-line distance within 30 metres of each actual route piece. That is a location matching tolerance, **not a lamp's light radius**. Missing nodes cannot indicate darkness. Map-edit dates cannot indicate inspections. New built-in searches persist the evidence; older saved trips and custom-server results are not retroactively relabelled.

## Why lighting is not a score yet

Official BMC service and OpenCity searches did not reveal a verified, reusable road-level dataset with recent working-light inspections or measured illumination. Locations alone cannot establish whether lights work or illuminate the user's walking path. The app shows mapped lamps and explains this limit rather than replacing an unavailable factor with a fabricated rating.

For a defensible lighting factor, obtain BMC/BEST/other relevant operator data with asset IDs, coordinates, ownership and coverage boundaries, dated working/fault/inspection status, update frequency and reuse permission. Prefer measured night-time illumination and pedestrian-path coverage. Establish and validate a scoring methodology before changing recommendations; a working pole is still not a guarantee of safe travel.