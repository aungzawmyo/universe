# Universe Explorer guide

How to use the laboratories, and how the engine is put together. For install and a feature list, see the [README](../README.md).

## Using the laboratories

### Solar System

Default mode. The Sun, eight planets, the Moon, Phobos, Deimos, Ceres, Vesta, the Galilean moons, Titan, Enceladus, Titania, Triton, Pluto, Eris, and Halley’s Comet.

- Click a world in the catalog or in the scene to inspect mass, radius, temperature, velocity, and light time.
- **Orbit** and **Surface view** move the camera. Follow, Free fly, Telescope, and Photon are present; Orbit and Surface view are the ones that change framing.
- **Sandbox → Scenarios** run experiments. Changing mass or \(G\), or applying a scenario, switches the engine from Kepler to N-body.
- Integrators: Velocity Verlet (default), leapfrog, RK4.

Measure two bodies with the Sandbox A/B dropdowns. The inspector prints distance, light time, orbital period, escape speed, and (in N-body) mechanical energy plus a drift plot. The dashed tape draws A→B. Removing Jupiter also removes its moons. Press **Tour** or **T** for a six-stop walkthrough. Press **?** or **Help** for shortcuts. Deep-link a lab with `?lab=black-hole`, a world with `?focus=jupiter`, a scenario with `?scenario=no-jupiter`, or the tour with `?tour=1`.

### Stars

Table-driven life cycle for a chosen mass and age. **Run life cycle** advances age. The HR plot is a single-star marker on a temperature–luminosity plane.

Low-mass path: cloud → protostar → main sequence → red giant → planetary nebula → white dwarf.  
Massive path (\(M \ge 8\,\mathrm{M}_\odot\)): red supergiant → supernova → neutron star or black hole.

### Black hole

Sliders: mass, spin \(a_*\), inclination, observer distance. The inspector shows Schwarzschild radius \(r_s = 2GM/c^2\), the photon sphere \(1.5\,r_s\), and gravitational time dilation. Spin changes the disk appearance; it is not a Kerr geodesic solver.

### Neutron star

Typical \(1.4\,\mathrm{M}_\odot\), \(\sim 12\,\mathrm{km}\). Period and \(\log B\) drive the beam animation. Orbit the camera to see why a pulsar pulses.

### Nebula

GPU particle cloud. Raise density, then **Gravity collapse** to a protostar. **Reset cloud** restores the gas. Not SPH.

### Light

Redshift slider implements \(1+z = \lambda_\mathrm{obs}/\lambda_\mathrm{em}\). Lens mass bends the educational path. Paths are drawn as curved null-like arcs, not Newtonian force on a photon.

### Spacetime

Rubber-sheet well plus geodesic and light-cone toggles. The inspector states that this is an analogy: 3+1 spacetime is not a 2D dent in space.

### Galaxies and structure

- **Milky Way** — level-1 spiral-arm particles, Sgr A*, Sun in the Orion–Cygnus arm.
- **Galaxies** — Hubble types from the built-in survey list.
- **Local Group** — accelerated MW–Andromeda clock in Gyr.
- **Cosmic web** — clusters, filaments, voids.
- **Observable universe** — observer at the center. Farther out is younger.
- **Big Bang** — drag the timeline. Temperature and scale factor \(a\) change. This is expansion of space, not a blast into pre-existing emptiness.
- **Life** — a petri-dish artificial-life model. Organisms are programs (genome), not humans. Each tick: resources and morphogens diffuse, cells follow local automata, Fibonacci-weighted growth adds fractal branches, energy pays for move/grow/repair/reproduce, mutation varies the program, and the environment selects. This is not a discovered “life algorithm.”

## Sandbox scenarios

| Scenario | Effect |
|---|---|
| Reset solar system | Restore catalog Kepler state |
| Sun becomes 2 M☉ | Double solar mass, N-body |
| Jupiter disappears | Remove Jupiter and cascade-remove its moons |
| Earth without Moon | Remove the Moon |
| Earth → Venus orbit | Move Earth inward |
| Remove the Sun | Unbind the planets |
| Add another star / Binary | Companion star |
| Sun becomes red giant | Stars lab, Sun-like, late age |
| Supernova | Stars lab, \(15\,\mathrm{M}_\odot\) |
| Neutron-star merger | Neutron-star lab |
| Star orbiting black hole | Insert a simulated BH in the system |
| Black-hole lensing | Black-hole lab, lensing on |
| Milky Way–Andromeda | Local Group |
| Universe expansion / CMB / First stars | Big Bang timeline presets |
| Galaxy formation | Galaxies lab |

Create: planet, star, binary, asteroid, black hole, and neutron star spawn bodies in the solar system and switch the engine to N-body. Nebula and galaxy still open the matching laboratory — those scales are not honest N-body objects.

## Data sources

Never mix classes invisibly.

| Class | Examples |
|---|---|
| Real | Sun, Earth, Jupiter, Proxima Centauri (catalog) |
| Model | Stellar life-cycle snapshot |
| Simulated | Sandbox asteroid, mass-changed Sun |
| Educational | Observable universe, Big Bang timeline |
| Statistical | Milky Way particles |
| Procedural | Cosmic web |
| Analogy | Spacetime rubber sheet |

Authoritative references for future catalog work: [NASA](https://www.nasa.gov/), [JPL SSD](https://ssd.jpl.nasa.gov/), [Gaia](https://www.esa.int/Science_Exploration/Space_Science/Gaia), [SIMBAD](https://simbad.cds.unistra.fr/simbad/), [NED](https://ned.ipac.caltech.edu/).

## Engine design

### Units

All simulation math is SI: meters, kilograms, seconds. Display code in `src/engine/units.ts` converts to AU, ly, M☉, and human time.

### Two solar-system engines

1. **Kepler** — closed-form two-body elements about the parent. Default, cheap, stable.
2. **N-body** — \( \vec a_i = G \sum_{j \ne i} m_j (\vec r_j - \vec r_i)/|\vec r_j - \vec r_i|^3 \) with Velocity Verlet, leapfrog, or RK4.

Any mutation (`setMass`, `setG`, `removeBody`, `launchAsteroid`, most scenarios) calls `enableNBody()`. Hierarchical moons keep Kepler motion about their parent during N-body of the planets.

### Scale

`src/engine/scale.ts` maps camera distance to a `CosmicScale` band and a render unit. The renderer only sees positions relative to the focused body, divided by that unit. That avoids storing the cosmic web in the same `Vector3` as Phobos.

Laboratories that are not the solar system use a local camera frame (`CameraRig` `localLogR`) instead of AU coordinates.

### Visual vs physics

`visualRadiusM` in `src/rendering/visual.ts` enlarges bodies for education mode. It is never written into `SimBody.radiusM` or the integrator.

### State

- `src/simulation/engine.ts` — singleton `simulation`: bodies, time, photons, scenarios.
- `src/simulation/store.ts` — Zustand UI: mode, layers, time scale, laboratory sliders.

The render loop steps the engine only in solar-system mode. Other labs animate from store sliders (`starAgeMyr`, `cosmologyT`, `andromedaT`, …).

## Adding a planet or moon

1. Append a `CatalogBody` in `src/data/solar-system.ts` with `massKg`, `radiusM`, Kepler elements, and `dataSource: "real"`.
2. Add its `id` to `TREE_ORDER` so it appears in the catalog.
3. Optionally add a texture branch in `src/rendering/textures.ts`.

Do not put display-only scale factors on the catalog object.

## Adding a laboratory

1. Extend `LabMode` and `LAB_MODES` in `src/engine/types.ts`.
2. Add a scene in `src/rendering/modes/` and mount it from `Scene.tsx`.
3. Add an inspector branch in `src/ui/Inspector.tsx`.
4. Map a scale-ribbon band in `src/ui/ScaleRibbon.tsx` if the lab belongs on the journey.

Keep the physics approximation honest in the inspector badge.

## Known limits

- Zooming the solar-system camera does not automatically enter other laboratories. Use chips, search, or the scale ribbon.
- Create black hole / neutron star / nebula / galaxy switches mode rather than inserting a body (except the solar-system BH scenario).
- Jupiter-disappears does not remove Io–Callisto.
- Wavelength is a grade and tint, not instrument-specific imagery.
- There is no automated test suite yet. Prefer adding engine tests around Kepler Earth–Sun, N-body after a mass change, and scenario orphan rules before changing integrators.
