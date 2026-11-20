import * as THREE from 'three';
import { CONFIG } from './config.js';
import { mod1 } from './sweep.js';
import { clearBaseFootprint } from './chunks.js';

const GRID = CONFIG.GRID;
const SIZE = CONFIG.SURFACE_SIZE;
const HEIGHT = CONFIG.DUST_HEIGHT;
const CHUNK_CELLS = CONFIG.CHUNK_CELLS;
const CHUNKS = CONFIG.CHUNKS_PER_SIDE;

function placeTexture(texture, planeSize, centerX, centerZ) {

    texture.repeat.set(
        planeSize / SIZE,
        planeSize / SIZE
    );

    texture.offset.set(
        mod1((centerX - planeSize / 2) / SIZE),
        mod1(1 - (centerZ + planeSize / 2) / SIZE)
    );
}

function optimizeTexture(texture) {

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    texture.generateMipmaps = false;

    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    texture.colorSpace = THREE.SRGBColorSpace;

}

export function createDustSystem(scene) {

    // Canvas yaradılır
    const canvas = document.createElement('canvas');

    canvas.width = GRID;
    canvas.height = GRID;

    const ctx = canvas.getContext('2d', {
        alpha: true
    });

    // Başlanğıc toz
    ctx.fillStyle = '#ffffff';

    ctx.fillRect(
        0,
        0,
        GRID,
        GRID
    );

    // Parça sərhədləri
    ctx.fillStyle = '#d4d4d4';

    for (let k = 0; k < CHUNKS; k++) {

        const edge = k * CHUNK_CELLS;

        ctx.fillRect(
            edge - 1,
            0,
            2,
            GRID
        );

        ctx.fillRect(
            0,
            edge - 1,
            GRID,
            2
        );
    }

    ctx.fillRect(
        GRID - 1,
        0,
        1,
        GRID
    );

    ctx.fillRect(
        0,
        GRID - 1,
        GRID,
        1
    );

    // Əsas tekstura
    const texTop = new THREE.CanvasTexture(canvas);

    optimizeTexture(texTop);

    // İkinci tekstura
    const texWin = texTop.clone();

    optimizeTexture(texWin);

    // Əsas toz müstəvisi
    const top = new THREE.Mesh(
        new THREE.PlaneGeometry(
            CONFIG.FAR_SIZE,
            CONFIG.FAR_SIZE
        ),

        new THREE.MeshStandardMaterial({
            color: CONFIG.DUST_COLOR,
            map: texTop,
            alphaTest: 0.5,
            roughness: 1.0
        })
    );

    top.rotation.x = -Math.PI / 2;
    top.frustumCulled = false;
    top.renderOrder = 0;

    scene.add(top);

    // Yan qatlar
    const walls = [];

    const wallCount = CONFIG.WALL_COLORS.length;

    for (let index = 0; index < wallCount; index++) {

        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(
                CONFIG.LAYER_WINDOW,
                CONFIG.LAYER_WINDOW
            ),

            new THREE.MeshBasicMaterial({
                color: CONFIG.WALL_COLORS[index],
                map: texWin,
                alphaTest: 0.5
            })
        );

        mesh.rotation.x = -Math.PI / 2;
        mesh.frustumCulled = false;
        mesh.renderOrder = index + 1;

        scene.add(mesh);

        walls.push({
            mesh,
            height:
                (HEIGHT * (wallCount - index)) /
                (wallCount + 1)
        });
    }

    // Təmizləmə göstəricisifh5ngrtf
    const marker = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),

        new THREE.MeshBasicMaterial({
            color: 0x66ffcc,
            transparent: true,
            opacity: 0.35,
            depthWrite: false
        })
    );

    marker.rotation.x = -Math.PI / 2;
    marker.visible = false;

    scene.add(marker);

    // Toz sistemi
    const dustSystem = {

        cleaned: new Uint8Array(GRID * GRID),

        cleanedCount: 0,

        version: 0,

        chunkCleaned: new Uint16Array(
            CHUNKS * CHUNKS
        ),

        chunkDone: new Uint8Array(
            CHUNKS * CHUNKS
        ),

        rewardPending: 0,

        ctx,
        canvas,

        texTop,
        texWin,

        top,
        walls,
        marker,

        lastHit: null,

        dirty: false,

        lastUpload: 0,

        uploadInterval: 100
    };

    // Bazanın altını təmizlə
    clearBaseFootprint(dustSystem);

    return dustSystem;
}


// Toz pəncərəsinin yenilənməsi
export function updateDustWindow(
    dustSystem,
    playerPos,
    nowMs
) {

    // Əsas müstəvi
    dustSystem.top.position.set(
        playerPos.x,
        HEIGHT,
        playerPos.z
    );

    placeTexture(
        dustSystem.texTop,
        CONFIG.FAR_SIZE,
        playerPos.x,
        playerPos.z
    );

    // Yan müstəvilər
    for (const wall of dustSystem.walls) {

        wall.mesh.position.set(
            playerPos.x,
            wall.height,
            playerPos.z
        );
    }

    placeTexture(
        dustSystem.texWin,
        CONFIG.LAYER_WINDOW,
        playerPos.x,
        playerPos.z
    );

    // GPU yenilənməsi
    if (
        dustSystem.dirty &&
        nowMs - dustSystem.lastUpload >=
        dustSystem.uploadInterval
    ) {

        dustSystem.texTop.needsUpdate = true;
        dustSystem.texWin.needsUpdate = true;

        dustSystem.dirty = false;

        dustSystem.lastUpload = nowMs;
    }
}
