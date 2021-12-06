if (figma.command === 'blobify') {
    blobify();
}
else if (figma.command === 'template') {
    generateTemplate();
}
function generateTemplate() {
    console.log("Generating template");
}
function blobify() {
    // Get selection
    let initialSelection = figma.currentPage.selection;
    if (!initialSelection) {
        figma.closePlugin('Please make a selection');
    }
    // Ensure selection is all Circles or Squaresds
    const areAllCirclesOrSquares = initialSelection.every(shape => isCircle(shape) || isSquare(shape));
    if (!areAllCirclesOrSquares) {
        figma.closePlugin('Shapes must all be circles or squares');
    }
    const selection = [...initialSelection];
    // Ensure all shapes are integer multiples of the smallest shape
    const minWidth = Math.min(...selection.map(({ width }) => width));
    const maxWidth = Math.max(...selection.map(({ width }) => width));
    const minX = Math.min(...selection.map(({ x }) => x));
    const minY = Math.min(...selection.map(({ y }) => y));
    const areAllIntegerMultiples = selection.every(({ width }) => width === minWidth || width === 2 * minWidth || width === 3 * minWidth || width === 4 * minWidth);
    if (!areAllIntegerMultiples) {
        figma.closePlugin('Shapes must all be integer multiples of each other');
    }
    // Convert Circles to Squares
    selection.forEach((shape, index) => {
        if (isCircle(shape)) {
            const { x, y, width, height, fills, parent } = shape;
            const rect = createNewRectangle({ x, y, width, height, fills, parent });
            shape.remove();
            selection.splice(index, 1, rect);
        }
    });
    // Expand each shape by 1px in each direction
    selection.forEach((shape, index) => {
        const { x, y, width, height, fills, parent } = shape;
        const rect = createNewRectangle({
            x: x - 1,
            y: y - 1,
            width: width + 2,
            height: height + 2,
            fills,
            parent
        });
        shape.remove();
        selection.splice(index, 1, rect);
    });
    // Union all shapes
    const union = figma.union(selection, selection[0].parent);
    // Add fills & corner radius
    union.fills = selection[0].fills;
    union.cornerRadius = maxWidth;
    // Flatten the union
    const blob = figma.flatten([union]);
    blob.name = "Blob";
    blob.resize(blob.width - 2, blob.height - 2);
    blob.x = minX;
    blob.y = minY;
    figma.currentPage.selection = [blob];
    figma.closePlugin('Created new LeafyGreen Blob');
}
/**
 * Utilities
 */
function isCircle(shape) {
    return shape.type === "ELLIPSE" && shape.width === shape.height;
}
function isSquare(shape) {
    return shape.type === "RECTANGLE" && shape.width === shape.height;
}
function createNewRectangle({ x, y, width, height, fills, parent }) {
    const rect = figma.createRectangle();
    rect.x = x;
    rect.y = y;
    rect.resize(width, height);
    rect.fills = fills;
    parent.appendChild(rect);
    return rect;
}

//# sourceMappingURL=sourcemaps/code.js.map
