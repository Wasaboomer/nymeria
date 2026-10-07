# Character Asset Spec v1 — isolated POC

Logical canvas: **1024 × 1536**, origin top-left, positive x right / y down.
All modules share the same pose and scale. Bounds are reserved placement zones,
not masks: art may overlap a neighbour deliberately. Anchors are registration points.
Order below is back-to-front; replacement preserves the same DOM layer position.

| Zone | Bounds x,y,w,h | Anchor x,y |
| --- | --- | --- |
| back | 270,330,484,840 | 512,355 |
| legs | 355,810,314,530 | 512,835 |
| feet | 325,1290,374,150 | 512,1320 |
| torso | 325,360,374,480 | 512,390 |
| arms | 215,390,594,540 | 512,410 |
| waist | 325,790,374,120 | 512,825 |
| head | 380,120,264,265 | 512,340 |
| offHand | 130,660,260,420 | 260,770 |
| mainHand | 735,530,160,710 | 790,785 |

Runtime schema: `CharacterModularPOC.spec` (debug only). Each module has a stable
zone ID, variant ID and local origin at its zone's x,y. Anchor local coordinates
are anchor minus zone origin. Future transparent PNGs should use full-canvas
1024×1536 export aligned to these anchors, or cropped bounds with an explicit
origin offset; never scale individual variants to fit a silhouette. Manifest
entries should declare spec version, zone, variant, source, origin, anchor and
placeholder status. Validate dimensions/registration before admitting production assets.

This POC uses labelled inline SVG calibration placeholders, **not PNG production
assets** and not an artistic proposal. BASE and CUSTODE replace only the torso
node with distinct geometry. Other eight nodes retain identity, geometry and order.
No filters, masks, master redraw or BODY MASTER v2 replacement. The existing
renderer and all existing art remain untouched. No animation or async asset loading
is needed for this technical test; no motion also respects reduced-motion users.

Access: `?test=1` → Menu → DEBUG → Modular Character POC. The details page lives
inside the existing debug route, so Back/bottom navigation use the existing stack.
No storage, game events or gameplay APIs. Refresh intentionally resets BASE.
To remove: delete `character-modular-poc.js`, its single script include, this doc
and its test; reduce navigation test asset count by one. No save migration required.
