# Nymeria Character Rig v1 — production contract

Status: **POC contract, not final artwork**. BODY MASTER v2 remains frozen and is not regenerated.

## Principle

Equipment art is no longer asked to fit an arbitrary painted body. Every visual item is authored against one immutable rig. Runtime places modules by stable zone/origin/anchor metadata and never rescales a variant to “make it fit”.

Logical canvas: **1024 × 1536**.

## Zones

| Zone | Bounds x,y,w,h | Anchor x,y | Seam / attachment contract |
| --- | --- | --- | --- |
| back | 270,330,484,840 | 512,355 | behind body; shoulder attachment at anchor |
| legs | 355,810,314,530 | 512,835 | upper seam hidden by waist |
| feet | 325,1290,374,150 | 512,1320 | overlaps lower leg seam |
| torso | 325,360,374,480 | 512,390 | neck anchor fixed; lower seam hidden by waist |
| arms | 215,390,594,540 | 512,410 | shoulder line fixed; may overlap torso |
| waist | 325,790,374,120 | 512,825 | covers torso/legs seam |
| head | 380,120,264,265 | 512,340 | neck join fixed |
| offHand | 130,660,260,420 | 260,770 | hand-grip anchor |
| mainHand | 735,530,160,710 | 790,785 | hand-grip anchor |

## Production rules

1. One body type/pose = one rig version. Assets never silently change pose, scale or anatomy.
2. Module files are transparent PNG/WebP or SVG with no labels, guides, backgrounds or baked character body.
3. A module may overlap adjacent zones, but its registration is always expressed in logical-canvas coordinates.
4. Runtime may translate a cropped module to its declared origin. Runtime must not independently scale/warp equipment variants.
5. Visual seams are deliberately covered by overlap zones (waist, shoulders, boots, helmet/hair), rather than requiring pixel-perfect cuts everywhere.
6. Gameplay equipment slots and visual modules are separate concepts. Several gameplay slots may contribute to one visual module.
7. BODY MASTER v2 is a visual reference and immutable source. It is not regenerated to manufacture equipment.
8. AI-generated images are references until they pass the admission checks below.

## Asset manifest contract

Each candidate must declare:

- `rigVersion`
- `zone`
- `variant`
- `file`
- `origin: {x,y}`
- `anchor: {x,y}`
- `nativeSize: {width,height}`
- `placeholder`
- optional `overlapZones`

## Automatic admission gate

A candidate can become a production module only if automation verifies:

- decodable image with alpha;
- expected native dimensions;
- non-empty alpha bounds;
- no visible pixels outside the declared permitted bounds/overlaps;
- anchor lies inside the module's permitted geometry;
- rig version matches;
- no runtime scale/warp required;
- compositing smoke test succeeds at 320/375/390/430 CSS widths.

Failure means **reject candidate**, not manually repair every item.

## Current checkpoint

Software modular composition passed. Direct generative output did not pass the production admission gate because it baked presentation graphics/background into the image. The next art proof must therefore be authored against this rig contract; repeated unconstrained generations are explicitly out of scope.
