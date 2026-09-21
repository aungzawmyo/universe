# Universe Explorer

**Interactive Universe Laboratory** — a multi-scale explorer and physics sandbox in the browser.

This is not one physically accurate simulation of the entire cosmos. Distances from a moon to the cosmic web differ by tens of orders of magnitude. The product is a set of laboratories that share one clock, one inspector, and one console. Each laboratory uses the physics approximation that scale can actually support.

Explore → Measure → Modify → Simulate → Understand.

Repository: [github.com/aungzawmyo/universe](https://github.com/aungzawmyo/universe)

## What you can do

| Laboratory | What you explore | Model |
|---|---|---|
| Solar System | Sun, eight planets, major moons, Ceres, Vesta, Enceladus, Titania, Eris, Halley, Pluto | Kepler orbits, then Newtonian N-body when you change the system |
| Stars | Mass, age, HR diagram, life cycle | Evolutionary table, not live hydrodynamics |
| Black Hole | Horizon, photon sphere, disk, spin, time dilation | Schwarzschild formulas; spin is visual |
| Neutron Star | Period, magnetic field, pulsar beams | Visual pulsar |
| Nebula | Density, collapse to a protostar | GPU particles |
| Light | Redshift \(1+z\), lens mass | Educational geodesics |
| Spacetime | Rubber-sheet well, geodesics, light cones | Labeled as an analogy |
| Milky Way | Arms, bulge, Sagittarius A* | Statistical particles |
| Galaxies | Hubble types including Andromeda, M87, Whirlpool | Catalog survey |
| Local Group | Milky Way–Andromeda approach | Accelerated encounter |
| Cosmic Web | Clusters, filaments, voids | Procedural |
| Observable Universe | Observer-centered shells | Distance = lookback time |
| Big Bang | Timeline, temperature, scale factor \(a\) | Expansion of space — not an explosion in empty space |
| Life | Energy, genome-as-program, morphogenesis, selection | Artificial life: Fibonacci growth, fractals, CA, reaction–diffusion — not a biological law |

The solar-system sandbox can change Sun mass and \(G\), remove Jupiter (and its moons) or the Moon, move Earth to Venus’s orbit, add a companion star, launch an asteroid, spawn a black hole or neutron star into the system, measure any two bodies, and switch integrators (Velocity Verlet, leapfrog, RK4). Share a laboratory with `?lab=black-hole`, a world with `?focus=jupiter`, a sandbox run with `?scenario=no-jupiter`, or the guided tour with `?tour=1`. Use **Share** to copy the current URL. Once N-body is on, the inspector plots mechanical energy over time.

## Requirements

- Node.js 20 or newer
- A browser with WebGL 2

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If port 3000 is already in use, Next.js will pick the next free port (often 3001).

```bash
npm run build
npm start
```

```bash
npm run lint
```

## Console

The scene is the product. Chrome is an observatory rail around it.

- **Search** — planets, moons, nearby stars (Proxima), galaxies (Andromeda), and laboratory modes
- **Catalog / Data** — open or close the left dock and the inspector
- **Education / Realistic / Simulation** — enhanced sizes, true sizes, or forced N-body
- **Wavelength** — γ, X, UV, Vis, IR, µ, R (tint and exposure, not a full telescope pipeline)
- **Laboratory chips** — switch scale without leaving Layers or Sandbox
- **Scale ribbon** — Ground → Observable Universe
- **Time** — reverse and forward presets through 100 years per second

On viewports narrower than 1100px the side panels start closed so the canvas stays usable.

### Keyboard

| Key | Action |
|---|---|
| Space | Pause / play |
| 1–8 | Time presets |
| F | Focus the selected body |
| P | Emit a photon |
| [ | Toggle catalog |
| ] | Toggle inspector |
| T | Start or end the tour |
| ← → | Previous / next tour stop |
| ? | Open or close the guide |
| Esc | Close guide, then inspector, then deselect |

## Accuracy and honesty

Three explicit modes:

- **Education** — readable planet sizes, true distances
- **Realistic** — real radii (most planets become tiny)
- **Simulation** — N-body on, ready for experiments

Visual exaggeration never writes back into the physics state. Earth can look larger on screen and still have radius \(6371\,\mathrm{km}\) and mass \(1\,\mathrm{M}_\oplus\).

Every inspector badge states the data class: **real**, **model**, **simulated**, **educational**, **statistical**, **procedural**, or **analogy**.

Catalog numbers use SI internally (`massKg`, `radiusM`, `temperatureK`). The UI shows AU, solar masses, and light time such as **8m 19s** for Earth–Sun.

Solar-system elements are J2000-style Keplerian approximations (NASA fact sheets / SSD), not a live JPL ephemeris.

## Architecture

Physics, astronomy data, and render state are separate:

```text
Universe state
 ├── Astronomy data     real catalog values
 ├── Physics state      simulation (m, kg, s)
 └── Render state       visual LOD only
```

Positions are hierarchical (moons stay in the parent frame). The camera uses a floating origin. Cosmic scales do not share one `Vector3` for the whole universe.

```text
src/
 ├── app/            Next.js App Router
 ├── data/           Solar System + nearby stars
 ├── engine/         units, Kepler, scale bands, types
 ├── lab/            stellar, BH, cosmology tables
 ├── physics/        Verlet, leapfrog, RK4, N-body
 ├── rendering/      R3F scenes and overlays
 ├── simulation/     clock, store, scenarios
 └── ui/             observatory console
```

Stack: Next.js 16, React 19, Three.js r186, React Three Fiber, Zustand, Tailwind 4, TypeScript.

Deeper notes: [docs/GUIDE.md](docs/GUIDE.md).

## What this is not

These are later-roadmap items, not current claims:

- Continuous zoom that silently swaps every renderer
- Full Kerr geodesics or gravitational waves
- SPH nebulae or stellar hydrodynamics
- Barnes–Hut / GPU N-body / WebGPU compute
- Collision detection, spacecraft, or a complete moon catalog
- Automated test suite

## License

MIT © 2026 AOS. See [LICENSE](LICENSE).
