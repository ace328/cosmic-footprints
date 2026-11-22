# Cosmic Footprints

**The machines may be silent. Their discoveries aren't.**

Cosmic Footprints is an interactive space-heritage atlas for school-age space enthusiasts. Visitors begin at Earth, travel to the Moon or Mars, and explore the stories of the human-made spacecraft and scientific equipment left on those worlds.

> An independent educational project created for the 2026 NASA Space Apps Challenge — **“Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars.”** NASA does not endorse this project.

## Explore the experience

1. Begin at Earth and choose the Moon or Mars.
2. Follow a cinematic, illustrative travel transition.
3. Explore the rotating planetary globe and its mission markers, or use the mission register.
4. Open a story to learn why an object was sent, what it discovered, how its mission ended, and where it remains.
5. Follow the original mission references and NASA data source.

The travel sequence is a visual metaphor, not a scale model of interplanetary distances or a real trajectory. Planetary surface markers are illustrative placements, not surveyed landing coordinates.

## Stories in this release

| Destination | Object                           | What the story explores                                                    |
| ----------- | -------------------------------- | -------------------------------------------------------------------------- |
| Moon        | Surveyor 3                       | Robotic lunar landing, soil investigation, and the Apollo 12 visit         |
| Moon        | Lunar Roving Vehicle             | Human-operated electric mobility and the three Apollo rover traverses      |
| Moon        | ALSEP                            | Long-running lunar science experiments and their 1977 shutdown             |
| Mars        | Mars Pathfinder & Sojourner      | The first wheeled rover on another planet and the lander that delivered it |
| Mars        | Spirit & Opportunity             | Twin rover discoveries and their different mission endings                 |
| Mars        | InSight                          | Marsquakes and the planet's interior                                       |
| Mars        | Ingenuity                        | The first powered, controlled flight on another planet                     |
| Mars        | Mars Polar Lander / Deep Space 2 | A lost polar landing attempt and its unknown final resting place           |

## NASA data used in the experience

### NSSDCA — Apollo Lunar Roving Vehicle record

Cosmic Footprints meaningfully incorporates mission-level traverse-distance data from NASA's Space Science Data Coordinated Archive (NSSDCA) record, [The Apollo Lunar Roving Vehicle](https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html).

The Lunar Roving Vehicle story turns the values reported by that NASA record into an in-app comparison:

| Mission            | Total distance driven |
| ------------------ | --------------------: |
| Apollo 15          |               27.8 km |
| Apollo 16          |               26.7 km |
| Apollo 17          |               35.9 km |
| **Combined total** |           **90.4 km** |

The combined total is calculated by adding the three mission totals. The application displays the figures as a comparative data visualization and links directly to the NASA source. These are historical mission totals, not generated estimates or live telemetry.

Other NASA mission pages and historical references support the narrative content. Their direct links are available in each artifact story and in the asset-credit files.

## Data, imagery and attribution

- NASA mission photographs and artist concepts are credited in the interface and in [public/artifacts/ASSET-CREDITS.md](public/artifacts/ASSET-CREDITS.md).
- The InSight illustration is identified as an artist's concept.
- Planetary texture sources and the Mars texture's CC BY 4.0 license are documented in [public/textures/ASSET-CREDITS.md](public/textures/ASSET-CREDITS.md).
- NSSDCA is explicitly identified beside the lunar rover data visualization.
- The globe's marker positions are educational illustrations; they must not be interpreted as verified coordinates.

This project is an independent educational experience and is not affiliated with or endorsed by NASA.

## Mission endings and educational experiences

Every mission story includes a **The Last Signal** chapter that separates the last known communication or operational event from the date NASA ended recovery attempts or formally retired a mission. The interface describes the reason for the ending and the certainty of the known resting place, with a direct mission-owner source link. For crew-operated Lunar Roving Vehicles, the interface labels the final operational use rather than implying that the rover sent an independent radio signal.

Mars Polar Lander / Deep Space 2 has no surface marker because NASA did not confirm its resting place. It remains accessible through a clearly labelled **Lost Signal / Location Unknown** entry in the Mars archive. The globe's remaining markers are illustrative educational placements, not surveyed coordinates.

The archive's search and category filters are shared between the mission register and the 3D globe. Matching markers remain visible; unrelated markers are hidden. Clearing the filters restores the complete marker set.

Selected mission stories include planned-versus-achieved endurance comparisons:

- Sojourner: 7 planned sols versus 83 operating sols.
- Ingenuity: up to 5 planned demonstration flights versus 72 completed flights.

Ingenuity also has a 1–72 flight selector. The visual arc is explicitly illustrative and is not presented as a measured flight path or flight telemetry.

The **Take the 3-Minute Journey** guided mode introduces Surveyor 3, Spirit & Opportunity, and Ingenuity through short mission, discovery, ending and knowledge-check steps.

## Technology

- React 19 and TypeScript
- Vite
- React Router v7 Data Router
- Three.js for the planetary scenes and interactive surface markers
- GSAP and @gsap/react for cinematic transitions
- Tailwind CSS v4 and DaisyUI v5 for styling

There is no account system or application database. The educational mission archive is curated and stored locally in typed TypeScript data. Mars Mission Control uses Vercel serverless proxies for NASA rover feeds and the NASA Image and Video Library, with cache and curated Photojournal fallbacks for Curiosity. Lunar Mission Control uses the NASA Image and Video Library plus source-linked Photojournal fallbacks. The rest of the archive does not depend on live services.

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Create and inspect a production build:

```bash
npm run lint
npm run build
npm run preview
```

Vite writes the production site to `dist/`.

## Deploy to Vercel

1. Import this public GitHub repository into Vercel.
2. Select **Vite** as the framework preset.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Deploy. No environment variables are required.

The included `vercel.json` keeps the single-page application working when a visitor opens or refreshes a URL directly.

## Accessibility and performance notes

- The mission register provides a non-canvas way to open every story.
- Buttons are native keyboard-operable controls.
- The application respects the user's reduced-motion preference.
- Three.js scenes are lazy-loaded and their renderers, animation frames, event listeners, textures, materials and geometries are cleaned up.
- Renderer pixel ratio is capped to reduce GPU load.
- When WebGL cannot initialize, destination navigation continues to the archive so the mission register remains usable.

## AI assistance disclosure

AI assistance was used during development for research organization, drafting and editing explanatory copy, code generation, debugging suggestions and submission preparation. The project team remains responsible for checking mission facts, source attribution, code and final content. The current application uses credited NASA imagery and programmatically rendered planetary scenes; it does not include AI-generated images or video.

## License and reuse

NASA imagery and third-party planetary textures retain their respective source terms and credits. See the asset-credit files before reusing any image or texture. The project code is provided for educational and hackathon review; third-party assets are not relicensed by this repository.

## Mars Mission Control — latest public NASA data

The Mars archive includes a **Mission Control** dashboard for Perseverance and Curiosity. It requests the latest publicly released raw-image records from NASA's Mars mission image feeds and refreshes the browser view every 15 minutes while the page is visible.

- Perseverance raw-image feed: `https://mars.nasa.gov/rss/api/?ver=1.2&feed=raw_images&feedtype=json&category=mars2020&num=12&page=0&order=sol%20desc`
- Curiosity raw-image feed: `https://mars.nasa.gov/api/v1/raw_image_items/?order=sol%20desc,instrument_sort%20desc,sample_type_sort%20desc,date_taken%20desc&per_page=12&page=0&extended=thumbnail::sample_type::noteq`
- Perseverance latest traverse map: https://science.nasa.gov/mission/mars-2020-perseverance/location-map/
- Curiosity latest traverse map: https://science.nasa.gov/mission/msl-curiosity/location-map/

The dashboard distinguishes the image capture time on Mars, the time the image was received on Earth (when supplied by NASA), and the time the visitor's browser last checked the feed. It stores the last successful response in browser storage and displays it as a cached copy if NASA's feed is unavailable. It never substitutes fabricated telemetry.

**Location limitation:** NASA's public interactive location maps show the latest reported drive endpoints and traverse path. NASA describes these maps as showing the rover's latest location; they are updated as drive data is published. They are not continuous GPS trackers or a live video feed. Cosmic Footprints links to those official maps instead of inventing rover coordinates or animating a false live position.

**API limitation:** NASA's legacy Mars Rover Photos API in the NASA Open APIs portal is marked archived. The dashboard therefore does not depend on that legacy endpoint. It uses the public raw-image feeds served by NASA's Mars mission websites; these website feeds are not presented as a guaranteed, versioned public API and may change. If the feed cannot be read, the dashboard shows the cached copy (if available) or a clear unavailable state with a link to NASA's official image gallery.

Ingenuity is shown as a historical flight archive only. NASA states that its final flight was Jan. 18, 2024 and its mission ended Jan. 25, 2024 after 72 flights: https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/

This Mission Control panel is an educational companion to NASA's official data resources. It is not affiliated with or endorsed by NASA.

## Lunar Mission Control — NASA imagery and mission heritage

The Moon archive now includes a **Lunar Mission Control** dashboard. It is reachable from the Moon archive and brings together NASA lunar imagery, the Lunar Reconnaissance Orbiter (LRO), official lunar mapping tools, historical mission tracking and the Artemis roadmap.

### Lunar imagery

- The dashboard searches NASA's public Image and Video Library for Lunar Reconnaissance Orbiter surface imagery.
- The browser refreshes the library search every 15 minutes while the page is visible.
- A same-origin Vercel function at \`api/nasa-images.js\` proxies NASA's public \`images-api.nasa.gov/search\` endpoint. No API key is required.
- The interface labels these as NASA image-library archive records, not live camera images or current orbiter telemetry.
- If the library cannot be reached, the dashboard uses source-linked NASA Photojournal fallback images and clearly labels the fallback.

### LRO and lunar maps

NASA lists the Lunar Reconnaissance Orbiter as an active mission. LRO has studied the Moon from close orbit since 2009 and maps the surface while measuring temperature, composition and radiation.

The dashboard links to:

- NASA LRO mission page: https://science.nasa.gov/mission/lro/
- NASA Moon Trek: https://trek.nasa.gov/moon/
- LROC QuickMap: https://quickmap.lroc.asu.edu/
- NASA Eyes: https://eyes.nasa.gov/apps/solar-system/#/moon

The mapping tools use spacecraft observations and provide interactive lunar-surface exploration. Cosmic Footprints links to these official tools; it does not invent a live LRO orbital position or present a simulated marker as telemetry.

### Historical mission register

The register includes Apollo 11, 12, 14, 15, 16 and 17; Surveyor 3; the Lunar Roving Vehicle; ALSEP; and Artemis II. It also includes a NASA roadmap panel for Artemis III and Artemis IV.

The NASA NSSDCA record supplies the three Lunar Roving Vehicle distance values used in the existing Moon artifact story: Apollo 15 (27.8 km), Apollo 16 (26.7 km) and Apollo 17 (35.9 km), for a calculated combined total of 90.4 km.

NASA's Artemis program page currently describes Artemis II as a completed crewed lunar flyby (April 1–10, 2026), Artemis III as a planned low-Earth-orbit systems demonstration in 2027, and Artemis IV as the target for the first Artemis lunar landing in early 2028. Future dates are planning targets and may change; the application does not show a launch countdown.

### Curated fallback image credits

- Curiosity PIA26700 — NASA/JPL-Caltech. A composite of Navcam panoramas from Sol 5,000 and Sol 5,003; the blue/yellow treatment is an artistic interpretation. https://science.nasa.gov/photojournal/curiosity-postcard-celebrates-rovers-5000th-day-on-mars/
- Curiosity PIA16238 — NASA/JPL-Caltech/Malin Space Science Systems. https://photojournal.jpl.nasa.gov/catalog/PIA16238
- Lunar PIA12903 — NASA/GSFC/Arizona State University. https://science.nasa.gov/photojournal/first-look-apollo-12-and-surveyor-3/
- Lunar PIA14426 — NASA/GSFC/Arizona State University. https://science.nasa.gov/resource/action-shot/

These images are clearly identified as archive material. They are not substituted for a live downlink or represented as newly captured images.

This dashboard is an independent educational companion to NASA's public resources and is not affiliated with or endorsed by NASA.
