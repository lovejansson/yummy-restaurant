import ArtObject from "./objects/ArtObject.js";

/**
 * @typedef  {{obj: ArtObject, blocked: {
 * top: boolean,
 * right: boolean,
 * bottom: boolean,
 * left: boolean}}} CollisionResult
 */

/**
 * Collision detection by using Axis-Aligned Bounding Box (AABB) algorithm. 
 * Doesn't account for more deeply overlapping objects... expects user to separate objects on collision, so the 'blocked' properties may be
 * weird if that's not the case.
 * 
 * @param {ArtObject} obj1 
 * @param {ArtObject} obj2
 * @returns {CollisionResult|null} Returns an object with the colliding object and the blocked sides (top, right, bottom, left) or null if no collision.
 */
function getCollision(obj1, obj2) {
    const box1 = { x: obj1.pos.x, y: obj1.pos.y, width: obj1.width, height: obj1.height };
    const box2 = { x: obj2.pos.x, y: obj2.pos.y, width: obj2.width, height: obj2.height };

    const box1XEnd = box1.x + box1.width;
    const box2XEnd = box2.x + box2.width;
    const box1YEnd = box1.y + box1.height;
    const box2YEnd = box2.y + box2.height;



    // If box1 is to the left, top, right or bottom of box2 but not touching, i.e. outside of the limit of box2, they are not colliding. 
    const isColliding = !(box1XEnd < box2.x || box1YEnd < box2.y || box1.x > box2XEnd || box1.y > box2YEnd);

    if (isColliding) {
        // Calculate overlaps in Y and X direction and determine if it is a vertical collision and/or a horizontal collision
        const minYEnd = Math.min(box1YEnd, box2YEnd);
        const maxYStart = Math.max(box1.y, box2.y);
        const minXEnd = Math.min(box1XEnd, box2XEnd);
        const maxXStart = Math.max(box1.x, box2.x);

        const overlapY = minYEnd - maxYStart;
        const overlapX = minXEnd - maxXStart;

        const isVerticalCollision = overlapX >= overlapY;
        const isHorizontalCollision = overlapY >= overlapX;

        return {
            obj: obj2,
            overlapX,
            overlapY,
            blocked: {
                top: isVerticalCollision && box1.y > box2.y,
                right: isHorizontalCollision && box1.x < box2.x,
                bottom: isVerticalCollision && box1.y <= box2.y,
                left: isHorizontalCollision && box1.x > box2.x
            }
        };
    }

    return null;
}

export {getCollision};