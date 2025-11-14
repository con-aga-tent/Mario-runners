// modules/engine/physics.js
// Simple AABB physics: gravity, velocity integration, tile collisions.
// Exported API:
//   integrate(entity, dt)
//   resolveTileCollisions(entity, tileQuery)  <-- tileQuery(x,y,w,h) returns true if solid
//   pointInRect / aabbIntersect helpers

export const GRAVITY = 0.7;

export function integrate(entity, dt) {
  // dt in seconds (or normalized units). We treat dt as frame multiplier (1 ≈ 16ms)
  entity.vy += (entity.gravity ?? GRAVITY) * dt;
  entity.x += (entity.vx || 0) * dt;
  entity.y += (entity.vy || 0) * dt;
}

export function aabbIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// tileQuery: function(x,y,w,h) -> {solid:bool, tileRect: {x,y,w,h}} or null
export function resolveTileCollisions(entity, tileQuery) {
  // We'll do simple axis resolution: move back on Y then X
  // Check vertical collisions
  const probeV = { x: entity.x, y: entity.y, w: entity.w, h: entity.h };
  const hitV = tileQuery(probeV.x, probeV.y, probeV.w, probeV.h);
  if (hitV && hitV.solid) {
    // compute minimal push
    const tile = hitV.tileRect;
    const overlapYDown = (probeV.y + probeV.h) - tile.y;   // entity below top of tile
    const overlapYUp = (tile.y + tile.h) - probeV.y;       // entity above bottom of tile
    if (entity.vy > 0) {
      // landing on tile
      entity.y -= overlapYDown;
      entity.vy = 0;
      entity.jumping = false;
      entity.onGround = true;
    } else if (entity.vy < 0) {
      // hit head on tile
      entity.y += overlapYUp;
      entity.vy = 0;
      // optionally trigger head-hit logic via callback on entity
      if (typeof entity.onHeadHit === "function") entity.onHeadHit(tile);
    }
  } else {
    entity.onGround = false;
  }

  // Check horizontal collisions
  const probeH = { x: entity.x, y: entity.y, w: entity.w, h: entity.h };
  const hitH = tileQuery(probeH.x, probeH.y, probeH.w, probeH.h);
  if (hitH && hitH.solid) {
    const tile = hitH.tileRect;
    const overlapLeft = (probeH.x + probeH.w) - tile.x;
    const overlapRight = (tile.x + tile.w) - probeH.x;
    if (entity.vx > 0) {
      entity.x -= overlapLeft;
      entity.vx = 0;
    } else if (entity.vx < 0) {
      entity.x += overlapRight;
      entity.vx = 0;
    }
  }
}
