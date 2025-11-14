// modules/entities/koopa.js
import { aabbIntersect } from "../engine/physics.js";

export function createKoopa(x,y,imgShell,imgWalk) {
  const koopa = {
    x, y, w:44, h:52,
    vx: -1.0,
    state: "walking", // walking, shelled, shellMoving, revive
    reviveTimer: 0,
    imgShell, imgWalk,
    update(dt, ctx) {
      if (this.state === "walking") {
        this.x += this.vx * dt;
        // edge turn
        const aheadX = this.vx < 0 ? this.x - 4 : this.x + this.w + 4;
        const foot = { x: aheadX, y: this.y + this.h + 1, w: 2, h: 2 };
        const solidAhead = ctx.tileQuery(foot.x, foot.y, foot.w, foot.h);
        if (!solidAhead) this.vx *= -1;
      } else if (this.state === "shelled") {
        this.reviveTimer += dt;
        if (this.reviveTimer > (12 * 60)) { // frame-based revive; adjust per dt scaling
          this.state = "walking";
          this.reviveTimer = 0;
          this.vx = (Math.random()>0.5?1:-1);
        }
      } else if (this.state === "shellMoving") {
        this.x += this.vx * dt;
        // collision with other enemies handled by external logic
      }
    },
    draw(renderer) {
      if (this.state === "walking") renderer.drawSprite(this.imgWalk, this.x, this.y, this.w, this.h, this.vx>0);
      else renderer.drawSprite(this.imgShell, this.x, this.y, this.w, this.h, this.vx>0);
    },
    stomped() {
      if (this.state === "walking") {
        this.state = "shelled";
        this.vx = 0;
        this.reviveTimer = 0;
      } else if (this.state === "shelled") {
        // kick
        this.state = "shellMoving";
        this.vx = 6; // caller should set direction depending on player facing
      }
    },
    kick(direction) { this.state = "shellMoving"; this.vx = 6 * (direction>0?1:-1); }
  };
  return koopa;
}
