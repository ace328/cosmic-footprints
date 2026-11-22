import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

export type Destination = "moon" | "mars";

export type SceneMode =
    | "intro"
    | "destinations"
    | "traveling"
    | "archive";

interface SpaceSceneProps {
    mode: SceneMode;
    selectedDestination: Destination | null;
    reducedMotion: boolean;
    onDestinationSelect: (destination: Destination) => void;
    onArrival: (destination: Destination) => void;
}

interface SceneController {
    setMode: (mode: SceneMode) => void;
    travelTo: (destination: Destination) => void;
}

export function SpaceScene({
    mode,
    selectedDestination,
    reducedMotion,
    onDestinationSelect,
    onArrival,
}: SpaceSceneProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<SceneController | null>(null);
    const webglUnavailableRef = useRef(false);

    const modeRef = useRef(mode);
    const onSelectRef = useRef(onDestinationSelect);
    const onArrivalRef = useRef(onArrival);

    useEffect(() => {
        const mount = mountRef.current;

        if (!mount) return;

        let renderer: THREE.WebGLRenderer;

        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: "high-performance",
                alpha: false,
            });
        } catch (error) {
            console.error("Unable to initialize WebGL:", error);
            mount.dataset.webglUnavailable = "true";
            webglUnavailableRef.current = true;
            return;
        }

        mount.dataset.webglUnavailable = "false";
        webglUnavailableRef.current = false;

        // ========================================
        // SCENE AND CAMERA
        // ========================================

        const scene = new THREE.Scene();

        scene.background = new THREE.Color("#02050d");

        const camera = new THREE.PerspectiveCamera(
            38,
            1,
            0.1,
            100,
        );

        camera.position.set(0, 0, 7.55);

        const cameraTarget = new THREE.Vector3(0, 0, 0);

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 1.65),
        );

        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;

        mount.appendChild(renderer.domElement);

        const resize = () => {
            const width = mount.clientWidth || window.innerWidth;
            const height = mount.clientHeight || window.innerHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
            renderScene();
        };

        // ========================================
        // LIGHTING
        // ========================================

        scene.add(
            new THREE.HemisphereLight(
                0x9bbcff,
                0x080c18,
                1.05,
            ),
        );

        const sunlight = new THREE.DirectionalLight(
            0xfff3dd,
            3,
        );

        sunlight.position.set(-5, 2.5, 6);
        scene.add(sunlight);

        const rimLight = new THREE.PointLight(
            0x3577ff,
            3,
            24,
        );

        rimLight.position.set(5, -2, -4);
        scene.add(rimLight);

        // ========================================
        // TEXTURES
        // ========================================

        const textureLoader = new THREE.TextureLoader();

        const loadedTextures: THREE.Texture[] = [];

        const loadTexture = (
            path: string,
            isColor = false,
        ) => {
            const texture = textureLoader.load(
                path,
                undefined,
                undefined,
                (error) => {
                    console.error(`Texture loading failed: ${path}`, error);
                },
            );

            if (isColor) {
                texture.colorSpace = THREE.SRGBColorSpace;
            }

            texture.anisotropy = Math.min(
                renderer.capabilities.getMaxAnisotropy(),
                8,
            );

            loadedTextures.push(texture);

            return texture;
        };

        // Earth
        const earthMap = loadTexture(
            "/textures/earth_atmos_2048.jpg",
            true,
        );

        const earthNormal = loadTexture(
            "/textures/earth_normal_2048.jpg",
        );

        const earthSpecular = loadTexture(
            "/textures/earth_specular_2048.jpg",
        );

        const cloudMap = loadTexture(
            "/textures/earth_clouds_1024.png",
        );

        // Moon and Mars
        const moonMap = loadTexture(
            "/textures/moon_1024.jpg",
            true,
        );

        const marsMap = loadTexture(
            "/textures/mars_2k.jpg",
            true,
        );

        // ========================================
        // EARTH
        // ========================================

        const earthGroup = new THREE.Group();

        earthGroup.position.set(1.35, 0.05, 0);

        scene.add(earthGroup);

        const earthGeometry = new THREE.SphereGeometry(
            2.25,
            128,
            128,
        );

        const earthMaterial = new THREE.MeshPhongMaterial({
            map: earthMap,
            normalMap: earthNormal,
            normalScale: new THREE.Vector2(0.32, 0.32),
            specularMap: earthSpecular,
            specular: new THREE.Color(0x536b87),
            shininess: 18,
        });

        const earth = new THREE.Mesh(
            earthGeometry,
            earthMaterial,
        );

        earthGroup.add(earth);

        // Clouds
        const cloudGeometry = new THREE.SphereGeometry(
            2.275,
            128,
            128,
        );

        const cloudMaterial = new THREE.MeshPhongMaterial({
            color: 0xe4efff,
            alphaMap: cloudMap,
            transparent: true,
            opacity: 0.32,
            depthWrite: false,
            shininess: 2,
        });

        const clouds = new THREE.Mesh(
            cloudGeometry,
            cloudMaterial,
        );

        earthGroup.add(clouds);

        // Atmosphere
        const atmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec4 mvPosition =
            modelViewMatrix * vec4(position, 1.0);

          vNormal = normalize(normalMatrix * normal);
          vViewPosition = -mvPosition.xyz;

          gl_Position =
            projectionMatrix * mvPosition;
        }
      `,

            fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          float intensity = pow(
            1.0 - max(
              dot(
                normalize(vNormal),
                normalize(vViewPosition)
              ),
              0.0
            ),
            3.0
          );

          vec3 color = vec3(0.16, 0.46, 1.0);

          gl_FragColor = vec4(
            color,
            intensity * 0.76
          );
        }
      `,

            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide,
            depthWrite: false,
            toneMapped: false,
        });

        const atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(2.34, 96, 96),
            atmosphereMaterial,
        );

        earthGroup.add(atmosphere);

        const earthHaloMaterial = new THREE.MeshBasicMaterial({
            color: 0x1a54c9,
            transparent: true,
            opacity: 0.055,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const earthHalo = new THREE.Mesh(
            new THREE.SphereGeometry(2.43, 64, 64),
            earthHaloMaterial,
        );

        earthGroup.add(earthHalo);

        // ========================================
        // MOON
        // ========================================

        const moonGeometry = new THREE.SphereGeometry(
            0.82,
            96,
            96,
        );

        const moonMaterial = new THREE.MeshStandardMaterial({
            map: moonMap,
            roughness: 0.98,
            transparent: true,
            opacity: 0,
        });

        const moon = new THREE.Mesh(
            moonGeometry,
            moonMaterial,
        );

        moon.position.set(-14, 0, -2);
        moon.scale.setScalar(0.01);
        moon.userData.baseScale = 0.90;
        moon.userData.destination = "moon";

        scene.add(moon);

        // Moon atmospheric edge
        const moonHaloMaterial = new THREE.MeshBasicMaterial({
            color: 0xb7c5db,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        const moonHalo = new THREE.Mesh(
            new THREE.SphereGeometry(0.88, 64, 64),
            moonHaloMaterial,
        );

        moonHalo.position.copy(moon.position);
        moonHalo.scale.copy(moon.scale);

        scene.add(moonHalo);

        // ========================================
        // MARS
        // ========================================

        const marsGeometry = new THREE.SphereGeometry(
            1,
            96,
            96,
        );

        const marsMaterial = new THREE.MeshStandardMaterial({
            map: marsMap,
            roughness: 1,
            transparent: true,
            opacity: 0,
        });

        const mars = new THREE.Mesh(
            marsGeometry,
            marsMaterial,
        );

        mars.position.set(14, 0, -2);
        mars.scale.setScalar(0.01);
        mars.userData.baseScale = 0.96;
        mars.userData.destination = "mars";

        scene.add(mars);

        const marsHaloMaterial = new THREE.MeshBasicMaterial({
            color: 0xb9583c,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        const marsHalo = new THREE.Mesh(
            new THREE.SphereGeometry(1.08, 64, 64),
            marsHaloMaterial,
        );

        marsHalo.position.copy(mars.position);
        marsHalo.scale.copy(mars.scale);

        scene.add(marsHalo);

        // ========================================
        // LOCKED SOLAR SYSTEM PLANETS
        // The Moon, Earth and Mars remain the only destinations.
        // Other planets are visual, non-interactive context only.
        // ========================================

        const createLockedPlanetLabel = (name: string) => {
            const canvas = document.createElement("canvas");
            canvas.width = 320;
            canvas.height = 80;
            const context = canvas.getContext("2d");

            if (!context) return null;

            context.fillStyle = "rgba(5, 12, 24, 0.82)";
            context.strokeStyle = "rgba(164, 190, 229, 0.45)";
            context.lineWidth = 2;
            context.beginPath();
            context.roundRect(4, 4, 312, 72, 12);
            context.fill();
            context.stroke();

            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = "#dce8fa";
            context.font = "700 25px Arial, sans-serif";
            context.fillText(name.toUpperCase(), 160, 29);
            context.fillStyle = "#8fa4c5";
            context.font = "600 15px Arial, sans-serif";
            context.fillText("LOCKED  /  COMING SOON", 160, 54);

            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
            loadedTextures.push(texture);

            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 0,
                depthWrite: false,
                toneMapped: false,
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(1.38, 0.36, 1);
            return sprite;
        };

        const lockedPlanetConfigs = [
            {
                name: "Mercury",
                color: 0x9a8f83,
                radius: 0.22,
                x: -8.1,
                y: 0.08,
                mobileX: -1.55,
                mobileY: 2.75,
                mobileRadius: 0.17,
                spinSpeed: 0.19,
                floatSpeed: 0.58,
                floatAmplitude: 0.025,
                phase: 0.2,
            },
            {
                name: "Venus",
                color: 0xd6ad78,
                radius: 0.32,
                x: -6.15,
                y: -0.16,
                mobileX: -1.55,
                mobileY: -0.05,
                mobileRadius: 0.23,
                spinSpeed: -0.075,
                floatSpeed: 0.43,
                floatAmplitude: 0.035,
                phase: 1.1,
            },
            {
                name: "Jupiter",
                color: 0xc99d76,
                radius: 0.62,
                x: 5.85,
                y: -0.16,
                mobileX: 1.55,
                mobileY: 2.75,
                mobileRadius: 0.32,
                spinSpeed: 0.31,
                floatSpeed: 0.34,
                floatAmplitude: 0.025,
                phase: 2.2,
            },
            {
                name: "Saturn",
                color: 0xd7c49b,
                radius: 0.50,
                x: 7.75,
                y: 0.24,
                mobileX: 1.55,
                mobileY: -0.05,
                mobileRadius: 0.30,
                spinSpeed: 0.26,
                floatSpeed: 0.31,
                floatAmplitude: 0.03,
                phase: 2.9,
            },
            {
                name: "Uranus",
                color: 0x8dcbd0,
                radius: 0.36,
                x: 9.55,
                y: -0.14,
                mobileX: -1.55,
                mobileY: -2.55,
                mobileRadius: 0.23,
                spinSpeed: 0.17,
                floatSpeed: 0.27,
                floatAmplitude: 0.035,
                phase: 4.0,
            },
            {
                name: "Neptune",
                color: 0x527fc9,
                radius: 0.35,
                x: 11.25,
                y: 0.18,
                mobileX: 1.55,
                mobileY: -2.55,
                mobileRadius: 0.23,
                spinSpeed: 0.15,
                floatSpeed: 0.23,
                floatAmplitude: 0.03,
                phase: 5.1,
            },
        ];

        const createPlanetSurfaceTexture = (name: string) => {
            const canvas = document.createElement("canvas");
            canvas.width = 1024;
            canvas.height = 512;
            const context = canvas.getContext("2d");
            if (!context) return null;
            const palettes: Record<string, [string, string, string]> = {
                Mercury: ["#a99b8b", "#6c6259", "#d4c5b2"],
                Venus: ["#e8c68f", "#b98a52", "#f3dfb4"],
                Jupiter: ["#d8b18b", "#9d6c50", "#f0d6b4"],
                Saturn: ["#e1d0a6", "#a98e68", "#f0e1bc"],
                Uranus: ["#a5d9dc", "#65aeb9", "#c8eff0"],
                Neptune: ["#477bc8", "#183f8c", "#82b6ee"],
            };
            const [base, shadow, highlight] = palettes[name];
            context.fillStyle = base;
            context.fillRect(0, 0, canvas.width, canvas.height);

            if (["Jupiter", "Saturn", "Uranus", "Neptune"].includes(name)) {
                const count = name === "Jupiter" ? 28 : name === "Saturn" ? 24 : 16;

                for (let i = 0; i < count; i++) {
                    const y = (i / count) * canvas.height;
                    const bandHeight = canvas.height / count;
                    const wave = Math.sin(i * 0.72) * (name === "Jupiter" ? 18 : 9);

                    context.globalAlpha = name === "Jupiter"
                        ? 0.24 + (i % 3) * 0.09
                        : 0.18 + (i % 3) * 0.07;
                    context.fillStyle = i % 2 ? shadow : highlight;
                    context.beginPath();
                    context.moveTo(0, y);
                    context.bezierCurveTo(
                        canvas.width * 0.28,
                        y + wave,
                        canvas.width * 0.68,
                        y - wave * 0.65,
                        canvas.width,
                        y + Math.sin(i * 0.46) * 10,
                    );
                    context.lineTo(canvas.width, y + bandHeight * (0.48 + (i % 4) * 0.12));
                    context.bezierCurveTo(
                        canvas.width * 0.68,
                        y + bandHeight * 0.55 - wave * 0.35,
                        canvas.width * 0.28,
                        y + bandHeight * 0.55 + wave * 0.35,
                        0,
                        y + bandHeight * (0.48 + (i % 4) * 0.12),
                    );
                    context.closePath();
                    context.fill();
                }

                context.globalAlpha = 1;

                if (name === "Jupiter") {
                    for (let i = 0; i < 90; i++) {
                        const y = (i * 47) % canvas.height;
                        const x = (i * 113) % canvas.width;
                        context.globalAlpha = 0.08 + (i % 4) * 0.025;
                        context.strokeStyle = i % 2 ? highlight : shadow;
                        context.lineWidth = 1 + (i % 3) * 0.8;
                        context.beginPath();
                        context.moveTo(x, y);
                        context.bezierCurveTo(
                            x + 28,
                            y - 5,
                            x + 56,
                            y + 5,
                            x + 92,
                            y - 1,
                        );
                        context.stroke();
                    }

                    context.save();
                    context.translate(700, 300);
                    context.rotate(-0.1);
                    const spot = context.createRadialGradient(0, 0, 7, 0, 0, 72);
                    spot.addColorStop(0, "#c8755b");
                    spot.addColorStop(0.48, "#b85b43");
                    spot.addColorStop(0.82, "#9f4b3b");
                    spot.addColorStop(1, "rgba(137,66,49,0)");
                    context.fillStyle = spot;
                    context.beginPath();
                    context.ellipse(0, 0, 82, 38, 0, 0, Math.PI * 2);
                    context.fill();
                    context.strokeStyle = "rgba(244, 194, 160, 0.26)";
                    context.lineWidth = 5;
                    context.beginPath();
                    context.ellipse(0, 0, 66, 27, 0, 0, Math.PI * 2);
                    context.stroke();
                    context.restore();
                    context.globalAlpha = 1;
                }
            } else if (name === "Venus") {
                for (let i = 0; i < 24; i++) {
                    const y = (i * 83) % canvas.height;
                    context.globalAlpha = 0.13;
                    context.strokeStyle = i % 2 ? highlight : shadow;
                    context.lineWidth = 18 + (i % 5) * 8;
                    context.beginPath();
                    context.moveTo(-80, y);
                    context.bezierCurveTo(220, y - 90, 650, y + 90, 1100, y - 35);
                    context.stroke();
                }
                context.globalAlpha = 1;
            } else {
                for (let i = 0; i < 900; i++) {
                    const x = ((i * 197.3) % 1) * canvas.width + ((i * 53) % canvas.width);
                    const y = (i * 137.7) % canvas.height;
                    const radius = 2 + (i % 9) * (name === "Mercury" ? 2 : 0.8);
                    context.globalAlpha = 0.08 + (i % 5) * 0.025;
                    context.fillStyle = i % 2 ? shadow : highlight;
                    context.beginPath();
                    context.arc(x, y, radius, 0, Math.PI * 2);
                    context.fill();
                    context.globalAlpha = 0.08;
                    context.strokeStyle = highlight;
                    context.lineWidth = 1.2;
                    context.stroke();
                }
                context.globalAlpha = 1;
            }
            const shade = context.createLinearGradient(0, 0, 0, canvas.height);
            shade.addColorStop(0, "rgba(255,255,255,0.10)");
            shade.addColorStop(0.5, "rgba(255,255,255,0)");
            shade.addColorStop(1, "rgba(0,0,0,0.20)");
            context.fillStyle = shade;
            context.fillRect(0, 0, canvas.width, canvas.height);
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
            loadedTextures.push(texture);
            return texture;
        };

        const createSaturnRingTexture = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext("2d");
            if (!context) return null;
            const gradient = context.createRadialGradient(256, 256, 110, 256, 256, 250);
            gradient.addColorStop(0, "rgba(0,0,0,0)");
            gradient.addColorStop(0.28, "#8d795e");
            gradient.addColorStop(0.36, "#e0d0aa");
            gradient.addColorStop(0.43, "#887456");
            gradient.addColorStop(0.52, "#e8d9b8");
            gradient.addColorStop(0.60, "#a18b69");
            gradient.addColorStop(0.68, "#d9c8a4");
            gradient.addColorStop(0.77, "#76634d");
            gradient.addColorStop(0.88, "#d8c7a3");
            gradient.addColorStop(1, "rgba(0,0,0,0)");
            context.fillStyle = gradient;
            context.fillRect(0, 0, 512, 512);
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            loadedTextures.push(texture);
            return texture;
        };

        const lockedPlanets = lockedPlanetConfigs.map((config) => {
            const group = new THREE.Group();
            const spinGroup = new THREE.Group();
            group.add(spinGroup);

            const geometry = new THREE.SphereGeometry(config.radius, 64, 64);
            const surfaceTexture = createPlanetSurfaceTexture(config.name);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                map: surfaceTexture ?? undefined,
                roughness: config.name === "Jupiter" || config.name === "Saturn" ? 0.92 : 0.96,
                metalness: 0.01,
                transparent: true,
                opacity: 0,
                depthWrite: false,
            });
            const sphere = new THREE.Mesh(geometry, material);
            spinGroup.add(sphere);

            const materials: THREE.Material[] = [material];
            let ring: THREE.Mesh | null = null;

            if (config.name === "Saturn") {
                const ringGeometry = new THREE.RingGeometry(config.radius * 1.25, config.radius * 1.9, 96);
                const ringTexture = createSaturnRingTexture();
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    map: ringTexture ?? undefined,
                    transparent: true,
                    opacity: 0,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                });
                ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI * 0.36;
                ring.rotation.y = -0.18;
                spinGroup.add(ring);
                materials.push(ringMaterial);
            }

            const label = createLockedPlanetLabel(config.name);
            if (label) {
                label.position.set(0, -(config.radius + 0.46), 0.05);
                group.add(label);
                materials.push(label.material);
            }

            group.position.set(config.x, config.y, -1.5);
            group.scale.setScalar(0.001);
            group.userData.locked = true;
            scene.add(group);

            return { ...config, group, spinGroup, ring, materials };
        });

        // ========================================
        // DISTANT STARFIELD
        // ========================================

        const starCount = 2200;

        const starPositions = new Float32Array(
            starCount * 3,
        );

        for (let i = 0; i < starCount; i++) {
            const radius = THREE.MathUtils.randFloat(24, 48);

            const theta = Math.random() * Math.PI * 2;

            const phi = Math.acos(
                2 * Math.random() - 1,
            );

            starPositions[i * 3] =
                radius * Math.sin(phi) * Math.cos(theta);

            starPositions[i * 3 + 1] =
                radius * Math.sin(phi) * Math.sin(theta);

            starPositions[i * 3 + 2] =
                radius * Math.cos(phi);
        }

        const starGeometry = new THREE.BufferGeometry();

        starGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(starPositions, 3),
        );

        const starMaterial = new THREE.PointsMaterial({
            color: 0xcbdcff,
            size: 0.045,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            depthWrite: false,
        });

        const starField = new THREE.Points(
            starGeometry,
            starMaterial,
        );

        scene.add(starField);

        // ========================================
        // ORBITAL DECORATION
        // ========================================

        const orbitGeometry = new THREE.BufferGeometry();

        const orbitPoints = new THREE.EllipseCurve(
            0,
            0,
            3.35,
            0.52,
            0,
            Math.PI * 2,
            false,
            0,
        ).getPoints(160);

        orbitGeometry.setFromPoints(
            orbitPoints.map(
                (point) => new THREE.Vector3(
                    point.x,
                    point.y,
                    -0.15,
                ),
            ),
        );

        const orbitMaterial = new THREE.LineBasicMaterial({
            color: 0x6382b9,
            transparent: true,
            opacity: 0,
            depthWrite: false,
        });

        const orbit = new THREE.LineLoop(
            orbitGeometry,
            orbitMaterial,
        );

        scene.add(orbit);

        // ========================================
        // RAYCASTING
        // ========================================

        const raycaster = new THREE.Raycaster();

        const pointer = new THREE.Vector2();

        const interactivePlanets = [moon, mars];
        const draggablePlanets = [earth, moon, mars];

        let hoveredPlanet: THREE.Mesh | null = null;
        let hoveredPlanetBaseScale: THREE.Vector3 | null = null;
        let activeDragTarget: THREE.Object3D | null = null;
        let activePointerId: number | null = null;
        let pointerStartX = 0;
        let pointerStartY = 0;
        let lastPointerX = 0;
        let lastPointerY = 0;
        let dragDistance = 0;
        let suppressNextClick = false;

        const updatePointer = (event: PointerEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();

            pointer.x =
                ((event.clientX - rect.left) / rect.width) * 2 - 1;

            pointer.y =
                -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };

        const raycastPlanet = () => {
            raycaster.setFromCamera(pointer, camera);

            const intersections = raycaster.intersectObjects(
                interactivePlanets,
                false,
            );

            return intersections.length
                ? (intersections[0].object as THREE.Mesh)
                : null;
        };

        const raycastDraggablePlanet = () => {
            raycaster.setFromCamera(pointer, camera);

            const intersections = raycaster.intersectObjects(
                draggablePlanets,
                false,
            );

            return intersections.length
                ? (intersections[0].object as THREE.Mesh)
                : null;
        };

        const handlePointerDown = (event: PointerEvent) => {
            if (event.button !== 0 && event.pointerType !== "touch") return;
            if (
                modeRef.current !== "destinations" &&
                modeRef.current !== "intro"
            ) return;

            updatePointer(event);
            const hit = raycastDraggablePlanet();
            if (!hit) return;

            activeDragTarget = hit === earth ? earthGroup : hit;
            activePointerId = event.pointerId;
            pointerStartX = event.clientX;
            pointerStartY = event.clientY;
            lastPointerX = event.clientX;
            lastPointerY = event.clientY;
            dragDistance = 0;
            suppressNextClick = false;

            renderer.domElement.setPointerCapture(event.pointerId);
            renderer.domElement.style.cursor = "grabbing";
            clearHover();
        };

        const handlePointerUp = (event: PointerEvent) => {
            if (activePointerId !== event.pointerId) return;

            suppressNextClick = dragDistance > 5;
            activeDragTarget = null;
            activePointerId = null;
            renderer.domElement.style.cursor = "default";

            if (renderer.domElement.hasPointerCapture(event.pointerId)) {
                renderer.domElement.releasePointerCapture(event.pointerId);
            }
        };

        const clearHover = () => {
            if (!hoveredPlanet) {
                renderer.domElement.style.cursor = "default";
                return;
            }

            const previous = hoveredPlanet;

            gsap.killTweensOf(previous.scale);

            // Restore the exact scale that was active before hover. The
            // responsive Moon/Mars sizes differ between desktop and mobile.
            if (hoveredPlanetBaseScale) {
                previous.scale.copy(hoveredPlanetBaseScale);
            }

            hoveredPlanet = null;
            hoveredPlanetBaseScale = null;
            renderer.domElement.style.cursor = "default";
            renderScene();
        };

        const handlePointerMove = (event: PointerEvent) => {
            updatePointer(event);

            if (
                activePointerId === event.pointerId &&
                activeDragTarget
            ) {
                const deltaX = event.clientX - lastPointerX;
                const deltaY = event.clientY - lastPointerY;
                lastPointerX = event.clientX;
                lastPointerY = event.clientY;
                dragDistance = Math.hypot(
                    event.clientX - pointerStartX,
                    event.clientY - pointerStartY,
                );

                if (dragDistance > 5) {
                    activeDragTarget.rotation.y += deltaX * 0.008;
                    activeDragTarget.rotation.x = THREE.MathUtils.clamp(
                        activeDragTarget.rotation.x + deltaY * 0.006,
                        -0.85,
                        0.85,
                    );
                    renderScene();
                }
                return;
            }

            if (modeRef.current !== "destinations") {
                clearHover();
                return;
            }

            const nextPlanet = raycastPlanet();

            if (nextPlanet === hoveredPlanet) return;

            clearHover();

            if (!nextPlanet) return;

            hoveredPlanet = nextPlanet;
            hoveredPlanetBaseScale = nextPlanet.scale.clone();

            const targetScale = hoveredPlanetBaseScale.x * 1.13;

            renderer.domElement.style.cursor = "pointer";

            gsap.to(nextPlanet.scale, {
                x: targetScale,
                y: targetScale,
                z: targetScale,
                duration: 0.4,
                ease: "back.out(1.7)",
                onUpdate: renderScene,
                onComplete: renderScene,
            });
        };

        const handleClick = (event: MouseEvent) => {
            if (suppressNextClick) {
                suppressNextClick = false;
                return;
            }
            if (modeRef.current !== "destinations") return;

            updatePointer(event as unknown as PointerEvent);

            const planet = raycastPlanet();

            if (!planet) return;

            const destination =
                planet.userData.destination as Destination;

            onSelectRef.current(destination);
        };

        const handlePointerLeave = () => {
            clearHover();
        };

        renderer.domElement.style.touchAction = "none";
        renderer.domElement.addEventListener("pointerdown", handlePointerDown);
        renderer.domElement.addEventListener("pointerup", handlePointerUp);
        renderer.domElement.addEventListener("pointercancel", handlePointerUp);
        renderer.domElement.addEventListener(
            "pointermove",
            handlePointerMove,
        );

        renderer.domElement.addEventListener(
            "pointerleave",
            handlePointerLeave,
        );

        renderer.domElement.addEventListener(
            "click",
            handleClick,
        );

        // ========================================
        // CAMERA AND DESTINATION CONTROLLER
        // ========================================

        let activeTimeline: gsap.core.Timeline | null = null;

        const renderScene = () => {
            moonHalo.position.copy(moon.position);
            moonHalo.scale.copy(moon.scale);

            marsHalo.position.copy(mars.position);
            marsHalo.scale.copy(mars.scale);

            camera.lookAt(cameraTarget);
            renderer.render(scene, camera);
        };

        const showIntro = () => {
            activeTimeline?.kill();

            hoveredPlanet = null;

            const earthState = {
                x: 1.35,
                y: 0.05,
                z: 0,
                scale: 1,
            };

            if (reducedMotion) {
                earthGroup.position.set(
                    earthState.x,
                    earthState.y,
                    earthState.z,
                );

                earthGroup.scale.setScalar(1);

                moon.position.set(-14, 0, -2);
                moon.scale.setScalar(0.01);
                moonMaterial.opacity = 0;

                moonHaloMaterial.opacity = 0;

                mars.position.set(14, 0, -2);
                mars.scale.setScalar(0.01);
                marsMaterial.opacity = 0;

                marsHaloMaterial.opacity = 0;

                camera.position.set(0, 0, 7.55);
                cameraTarget.set(0, 0, 0);

                orbitMaterial.opacity = 0;

                lockedPlanets.forEach((planet) => {
                    planet.group.scale.setScalar(0.001);
                    planet.materials.forEach((material) => {
                        if ("opacity" in material) material.opacity = 0;
                    });
                });

                renderScene();
                return;
            }

            activeTimeline = gsap.timeline();

            activeTimeline
                .to(camera.position, {
                    x: 0,
                    y: 0,
                    z: 7.55,
                    duration: 1.8,
                    ease: "power3.inOut",
                }, 0)
                .to(cameraTarget, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 1.8,
                    ease: "power3.inOut",
                }, 0)
                .to(earthGroup.position, {
                    x: earthState.x,
                    y: earthState.y,
                    z: earthState.z,
                    duration: 1.8,
                    ease: "power3.inOut",
                }, 0)
                .to(earthGroup.scale, {
                    x: 1,
                    y: 1,
                    z: 1,
                    duration: 1.8,
                }, 0)
                .to(moonMaterial, {
                    opacity: 0,
                    duration: 0.5,
                }, 0)
                .to(marsMaterial, {
                    opacity: 0,
                    duration: 0.5,
                }, 0)
                .to(orbitMaterial, {
                    opacity: 0,
                    duration: 0.5,
                }, 0)
                .to(moon.scale, {
                    x: 0.01,
                    y: 0.01,
                    z: 0.01,
                    duration: 0.8,
                }, 0)
                .to(mars.scale, {
                    x: 0.01,
                    y: 0.01,
                    z: 0.01,
                    duration: 0.8,
                }, 0);

            lockedPlanets.forEach((planet) => {
                planet.group.scale.setScalar(0.001);
                planet.materials.forEach((material) => {
                    if ("opacity" in material) {
                        activeTimeline?.to(material, { opacity: 0, duration: 0.5 }, 0);
                    }
                });
            });
        };


        const showDestinations = () => {
            activeTimeline?.kill();
            clearHover();

            const viewportWidth = mount.clientWidth || window.innerWidth;
            const viewportHeight = mount.clientHeight || window.innerHeight;
            const viewportAspect = viewportWidth / Math.max(viewportHeight, 1);
            const isMobile = viewportWidth < 820 || viewportAspect < 1.48;

            const desktopCameraZ = THREE.MathUtils.clamp(
                12.5 / (Math.tan(THREE.MathUtils.degToRad(19)) * viewportAspect),
                17.5,
                25.5,
            );

            const layout = isMobile
                ? {
                    cameraZ: 16.2,
                    earth: { x: -0.82, y: 0.88, scale: 0.34 },
                    moon: { x: 0.82, y: 0.88, scale: 0.53 },
                    mars: { x: 0, y: -1.28, scale: 0.64 },
                }
                : {
                    cameraZ: desktopCameraZ,
                    earth: { x: -3.45, y: 0.25, scale: 0.53 },
                    moon: { x: 0, y: -0.30, scale: 0.90 },
                    mars: { x: 3.45, y: 0.25, scale: 0.96 },
                };

            const lockedOpacity = isMobile ? 0.66 : 0.78;

            const targetOrbitOpacity = isMobile ? 0 : 0.20;

            if (reducedMotion) {
                earthGroup.position.set(
                    layout.earth.x,
                    layout.earth.y,
                    0,
                );
                earthGroup.scale.setScalar(layout.earth.scale);

                moon.position.set(
                    layout.moon.x,
                    layout.moon.y,
                    0,
                );
                moon.scale.setScalar(layout.moon.scale);
                moonMaterial.opacity = 1;
                moonHaloMaterial.opacity = 0.09;

                mars.position.set(
                    layout.mars.x,
                    layout.mars.y,
                    0,
                );
                mars.scale.setScalar(layout.mars.scale);
                marsMaterial.opacity = 1;
                marsHaloMaterial.opacity = 0.12;

                camera.position.set(0, 0, layout.cameraZ);
                cameraTarget.set(0, 0, 0);

                orbitMaterial.opacity = targetOrbitOpacity;

                lockedPlanets.forEach((planet) => {
                    planet.group.position.set(
                        isMobile ? planet.mobileX : planet.x,
                        isMobile ? planet.mobileY : planet.y,
                        -1.5,
                    );
                    planet.group.scale.setScalar(isMobile ? 0.78 : 1);
                    planet.materials.forEach((material) => {
                        if ("opacity" in material) material.opacity = lockedOpacity;
                    });
                    if (planet.ring) {
                        planet.ring.rotation.set(Math.PI * 0.36, -0.18, 0.12);
                    }
                });

                renderScene();
                return;
            }

            activeTimeline = gsap.timeline({
                defaults: {
                    ease: "power3.inOut",
                },
            });

            activeTimeline
                .to(camera.position, {
                    x: 0,
                    y: 0,
                    z: layout.cameraZ,
                    duration: 2.4,
                }, 0)
                .to(cameraTarget, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 2.4,
                }, 0)

                // Earth
                .to(earthGroup.position, {
                    x: layout.earth.x,
                    y: layout.earth.y,
                    z: 0,
                    duration: 2.2,
                }, 0.15)
                .to(earthGroup.scale, {
                    x: layout.earth.scale,
                    y: layout.earth.scale,
                    z: layout.earth.scale,
                    duration: 2.2,
                }, 0.15)

                // Moon
                .to(moon.position, {
                    x: layout.moon.x,
                    y: layout.moon.y,
                    z: 0,
                    duration: 2,
                }, 0.35)
                .to(moon.scale, {
                    x: layout.moon.scale,
                    y: layout.moon.scale,
                    z: layout.moon.scale,
                    duration: 1.9,
                    ease: "back.out(1.2)",
                }, 0.35)
                .to(moonMaterial, {
                    opacity: 1,
                    duration: 1.2,
                }, 0.7)
                .to(moonHaloMaterial, {
                    opacity: 0.09,
                    duration: 1.2,
                }, 0.7)

                // Mars
                .to(mars.position, {
                    x: layout.mars.x,
                    y: layout.mars.y,
                    z: 0,
                    duration: 2,
                }, 0.5)
                .to(mars.scale, {
                    x: layout.mars.scale,
                    y: layout.mars.scale,
                    z: layout.mars.scale,
                    duration: 1.9,
                    ease: "back.out(1.2)",
                }, 0.5)
                .to(marsMaterial, {
                    opacity: 1,
                    duration: 1.2,
                }, 0.8)
                .to(marsHaloMaterial, {
                    opacity: 0.12,
                    duration: 1.2,
                }, 0.8)

                // Desktop orbit decoration
                .to(orbitMaterial, {
                    opacity: targetOrbitOpacity,
                    duration: 1.2,
                }, 1.1);

            lockedPlanets.forEach((planet, index) => {
                const targetX = isMobile ? planet.mobileX : planet.x;
                const targetY = isMobile ? planet.mobileY : planet.y;
                const targetScale = isMobile ? 0.78 : 1;

                activeTimeline
                    ?.to(planet.group.position, {
                        x: targetX,
                        y: targetY,
                        z: -1.5,
                        duration: 1.7,
                        ease: "power3.out",
                    }, 0.35 + index * 0.06)
                    .to(planet.group.scale, {
                        x: targetScale,
                        y: targetScale,
                        z: targetScale,
                        duration: 1.55,
                        ease: "back.out(1.25)",
                    }, 0.35 + index * 0.06);

                planet.materials.forEach((material) => {
                    if ("opacity" in material) {
                        activeTimeline?.to(material, {
                            opacity: lockedOpacity,
                            duration: 1.1,
                        }, 0.65 + index * 0.06);
                    }
                });
            });
        };


        const travelTo = (destination: Destination) => {
            activeTimeline?.kill();

            clearHover();

            const selected = destination === "moon" ? moon : mars;
            const other = destination === "moon" ? mars : moon;

            const otherHaloMaterial =
                destination === "moon"
                    ? marsHaloMaterial
                    : moonHaloMaterial;

            const destinationX = selected.position.x;
            const destinationY = selected.position.y;

            const travelDistance =
                destination === "moon" ? 3.65 : 4.45;

            if (reducedMotion) {
                camera.position.set(
                    destinationX,
                    destinationY,
                    travelDistance,
                );

                cameraTarget.set(
                    destinationX,
                    destinationY,
                    0,
                );

                other.material.opacity = 0;
                orbitMaterial.opacity = 0;
                lockedPlanets.forEach((planet) => {
                    planet.group.scale.setScalar(0.001);
                    planet.materials.forEach((material) => {
                        if ("opacity" in material) material.opacity = 0;
                    });
                });

                renderScene();

                onArrivalRef.current(destination);
                return;
            }

            activeTimeline = gsap.timeline({
                onComplete: () => {
                    onArrivalRef.current(destination);
                },
            });

            activeTimeline
                .to(camera.position, {
                    x: destinationX,
                    y: destinationY,
                    z: travelDistance,
                    duration: 3.1,
                    ease: "power3.inOut",
                }, 0)
                .to(cameraTarget, {
                    x: destinationX,
                    y: destinationY,
                    z: 0,
                    duration: 3.1,
                    ease: "power3.inOut",
                }, 0)
                .to(other.material, {
                    opacity: 0,
                    duration: 1.1,
                }, 0.2)
                .to(otherHaloMaterial, {
                    opacity: 0,
                    duration: 1.1,
                }, 0.2)
                .to(orbitMaterial, {
                    opacity: 0,
                    duration: 1,
                }, 0)
                .to(starField.scale, {
                    x: 1.22,
                    y: 1.22,
                    z: 1.22,
                    duration: 2.7,
                    ease: "power2.in",
                }, 0)
                .to(starMaterial, {
                    size: 0.075,
                    opacity: 1,
                    duration: 1.2,
                }, 0.5)
                .to(selected.scale, {
                    x: selected.scale.x * 1.06,
                    y: selected.scale.y * 1.06,
                    z: selected.scale.z * 1.06,
                    duration: 3.1,
                    ease: "power3.inOut",
                }, 0)
                .to(starMaterial, {
                    size: 0.045,
                    opacity: 0.8,
                    duration: 0.8,
                }, 2.5)
                .to(starField.scale, {
                    x: 1,
                    y: 1,
                    z: 1,
                    duration: 1,
                }, 2.5);

            lockedPlanets.forEach((planet) => {
                planet.group.scale.setScalar(0.001);
                planet.materials.forEach((material) => {
                    if ("opacity" in material) {
                        activeTimeline?.to(material, { opacity: 0, duration: 0.65 }, 0);
                    }
                });
            });
        };

        let animationFrame = 0;
        let disposed = false;
        const clock = new THREE.Clock();
        let animate: () => void = () => { };

        controllerRef.current = {
            setMode: (nextMode) => {
                if (nextMode === "intro") showIntro();

                if (nextMode === "destinations") {
                    showDestinations();
                }

                if (nextMode === "archive") {
                    if (animationFrame) {
                        window.cancelAnimationFrame(animationFrame);
                        animationFrame = 0;
                    }

                    renderScene();
                    return;
                }

                if (
                    !document.hidden &&
                    !animationFrame
                ) {
                    clock.start();
                    animate();
                }
            },

            travelTo,
        };

        // ========================================
        // RENDER LOOP
        // ========================================

        animate = () => {
            if (disposed) return;

            animationFrame = window.requestAnimationFrame(animate);

            const delta = Math.min(clock.getDelta(), 0.05);
            const elapsed = clock.elapsedTime;

            // Keep celestial bodies gently alive even when the OS requests reduced motion.
            // Reduced-motion mode slows the rotation instead of freezing the entire scene.
            const motionScale = reducedMotion ? 0.35 : 1;

            earthGroup.rotation.y += delta * 0.14 * motionScale;
            clouds.rotation.y += delta * 0.18 * motionScale;
            moon.rotation.y += delta * 0.12 * motionScale;
            mars.rotation.y += delta * 0.135 * motionScale;

            lockedPlanets.forEach((planet) => {
                planet.spinGroup.rotation.y += delta * planet.spinSpeed * motionScale;
                planet.spinGroup.position.y =
                    Math.sin(elapsed * planet.floatSpeed * motionScale + planet.phase) *
                    planet.floatAmplitude * motionScale;
            });

            starField.rotation.y += delta * 0.0008 * motionScale;

            renderScene();
        };

        if (!document.hidden) {
            clock.start();
            animate();
        } else {
            renderScene();
        }

        // ========================================
        // RESIZE AND VISIBILITY
        // ========================================

        const handleResize = () => {
            resize();

            if (modeRef.current === "destinations") {
                showDestinations();
            }
        };

        window.addEventListener("resize", handleResize);

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                    animationFrame = 0;
                }

                clock.stop();
            } else if (
                !animationFrame &&
                modeRef.current !== "archive"
            ) {
                clock.start();
                animate();
            } else {
                renderScene();
            }
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange,
        );

        resize();

        // ========================================
        // CLEANUP
        // ========================================

        return () => {
            disposed = true;

            activeTimeline?.kill();

            controllerRef.current = null;

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }

            window.removeEventListener("resize", handleResize);

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );

            renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
            renderer.domElement.removeEventListener("pointerup", handlePointerUp);
            renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
            renderer.domElement.removeEventListener(
                "pointermove",
                handlePointerMove,
            );

            renderer.domElement.removeEventListener(
                "pointerleave",
                handlePointerLeave,
            );

            renderer.domElement.removeEventListener(
                "click",
                handleClick,
            );

            lockedPlanets.forEach((planet) => {
                planet.group.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                        object.geometry.dispose();
                    }
                    if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
                        const objectMaterial = object.material;
                        if (Array.isArray(objectMaterial)) {
                            objectMaterial.forEach((material) => material.dispose());
                        } else {
                            objectMaterial.dispose();
                        }
                    }
                });
            });

            const geometries = [
                earthGeometry,
                cloudGeometry,
                atmosphere.geometry,
                earthHalo.geometry,
                moonGeometry,
                moonHalo.geometry,
                marsGeometry,
                marsHalo.geometry,
                starGeometry,
                orbitGeometry,
            ];

            const materials = [
                earthMaterial,
                cloudMaterial,
                atmosphereMaterial,
                earthHaloMaterial,
                moonMaterial,
                moonHaloMaterial,
                marsMaterial,
                marsHaloMaterial,
                starMaterial,
                orbitMaterial,
            ];

            geometries.forEach((geometry) => geometry.dispose());

            materials.forEach((material) => material.dispose());

            loadedTextures.forEach((texture) => texture.dispose());

            renderer.dispose();
            renderer.domElement.remove();
        };
    }, [reducedMotion]);

    // Keep event handlers in sync without writing refs during render.
    useEffect(() => {
        modeRef.current = mode;
        onSelectRef.current = onDestinationSelect;
        onArrivalRef.current = onArrival;

        controllerRef.current?.setMode(mode);
    }, [mode, onDestinationSelect, onArrival]);

    // Start a cinematic trip when React selects a destination.
    useEffect(() => {
        if (mode !== "traveling" || !selectedDestination) return;

        // Keep navigation usable when a browser cannot create a WebGL context.
        if (webglUnavailableRef.current) {
            onArrival(selectedDestination);
            return;
        }

        controllerRef.current?.travelTo(selectedDestination);
    }, [mode, selectedDestination, onArrival]);

    return (
        <div
            ref={mountRef}
            className="space-scene"
            aria-hidden="true"
        />
    );
}
