// Functions
export function isCircle(shape) {
    return shape.type === "ELLIPSE" && shape.width === shape.height;
}
export function isSquare(shape) {
    return shape.type === "RECTANGLE" && shape.width === shape.height;
}
export function createNewRectangle({ x, y, width, height, fills, parent }) {
    const rect = figma.createRectangle();
    rect.x = x;
    rect.y = y;
    rect.resize(width, height);
    rect.fills = fills;
    parent.appendChild(rect);
    return rect;
}

//# sourceMappingURL=sourcemaps/utils.js.map
