import { CONFIG } from './config.js';

const GRID = CONFIG.GRID;
const SIZE = CONFIG.SURFACE_SIZE;

export function mod1(value) {
    return ((value % 1) + 1) % 1;
}

function crossProduct(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) -
           (b[1] - a[1]) * (c[0] - a[0]);
}

function convexHull(points) {
    points.sort((p, q) =>
        (p[0] - q[0]) || (p[1] - q[1])
    );

    const lower = [];

    for (const point of points) {
        while (
            lower.length >= 2 &&
            crossProduct(
                lower[lower.length - 2],
                lower[lower.length - 1],
                point
            ) <= 0
        ) {
            lower.pop();
        }

        lower.push(point);
    }

    const upper = [];

    for (let k = points.length - 1; k >= 0; k--) {
        const point = points[k];

        while (
            upper.length >= 2 &&
            crossProduct(
                upper[upper.length - 2],
                upper[upper.length - 1],
                point
            ) <= 0
        ) {
            upper.pop();
        }

        upper.push(point);
    }

    lower.pop();
    upper.pop();

    return lower.concat(upper);
}

export function eraseSweep(dustSystem, ax, az, bx, bz, size) {

    // Eyni nöqtədə lazımsız hesablamanı azalt
    if (ax === bx && az === bz && dustSystem.lastHit) {
        return;
    }

    const half = size / 2;

    const hull = convexHull([
        [ax - half, az - half],
        [ax + half, az - half],
        [ax + half, az + half],
        [ax - half, az + half],

        [bx - half, bz - half],
        [bx + half, bz - half],
        [bx + half, bz + half],
        [bx - half, bz + half]
    ]);

    const ctx = dustSystem.ctx;

    const scale = GRID / SIZE;

    const baseX = mod1(ax / SIZE) * GRID;
    const baseY = mod1(az / SIZE) * GRID;

    // Çoxbucaqlının sərhədləri
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const point of hull) {
        const x = (point[0] - ax) * scale;
        const y = (point[1] - az) * scale;

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);

        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    // Yalnız Canvas daxilinə düşən təkrar sahələri çək
    const startX = Math.ceil(-(baseX + maxX) / GRID);
    const endX = Math.floor((GRID - baseX - minX) / GRID);

    const startY = Math.ceil(-(baseY + maxY) / GRID);
    const endY = Math.floor((GRID - baseY - minY) / GRID);

    ctx.globalCompositeOperation = 'destination-out';

    for (let shiftX = startX; shiftX <= endX; shiftX++) {
        for (let shiftY = startY; shiftY <= endY; shiftY++) {

            ctx.beginPath();

            for (let k = 0; k < hull.length; k++) {

                const pixelX =
                    baseX +
                    shiftX * GRID +
                    (hull[k][0] - ax) * scale;

                const pixelY =
                    baseY +
                    shiftY * GRID +
                    (hull[k][1] - az) * scale;

                if (k === 0) {
                    ctx.moveTo(pixelX, pixelY);
                } else {
                    ctx.lineTo(pixelX, pixelY);
                }
            }

            ctx.closePath();
            ctx.fill();
        }
    }

    ctx.globalCompositeOperation = 'source-over';

    dustSystem.dirty = true;
    dustSystem.lastHit = { x: bx, z: bz };
}
