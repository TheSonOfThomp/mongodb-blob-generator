if (figma.command === 'blobify') {
    blobify();
}
else if (figma.command === 'template') {
    generateTemplate();
}
function generateTemplate() {
    const TEMPLATE_SIZE = 2048;
    const GRID_SIZE = TEMPLATE_SIZE / 4;
    const springGreen = { r: 0, g: 237, b: 100 };
    const GrayLight3 = { r: 249, g: 251, b: 250 };
    // Create new 2048x2048 frame
    const frame = figma.createFrame();
    frame.resize(TEMPLATE_SIZE, TEMPLATE_SIZE);
    frame.x = figma.viewport.center.x - (TEMPLATE_SIZE / 2);
    frame.y = figma.viewport.center.y - (TEMPLATE_SIZE / 2);
    frame.name = "Blob template";
    const gridCircles = [];
    // Create 16 512px circles
    for (let i = 0; i < 16; i++) {
        const row = i % 4;
        const col = Math.floor(i / 4);
        const circle = createNewCircle({
            r: GRID_SIZE,
            x: col * GRID_SIZE,
            y: row * GRID_SIZE,
            parent: frame
        });
        setColor(circle, GrayLight3);
        gridCircles.push(circle);
    }
    const templateGroup = figma.group(gridCircles, frame);
    templateGroup.locked = true;
    // Create 2 Sample circles
    const circle1 = createNewCircle({
        r: GRID_SIZE,
        x: 0,
        y: 0,
        parent: frame,
    });
    const circle2 = createNewCircle({
        r: GRID_SIZE * 2,
        x: GRID_SIZE,
        y: GRID_SIZE,
        parent: frame,
    });
    setColor(circle1, springGreen);
    setColor(circle2, springGreen);
    figma.currentPage.selection = [circle1, circle2];
    figma.closePlugin('Created Blob template');
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
    figma.closePlugin('Created new MongoDB Blob');
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
    if (parent)
        parent.appendChild(rect);
    rect.x = x;
    rect.y = y;
    rect.resize(width, height);
    if (fills)
        rect.fills = fills;
    return rect;
}
function createNewCircle({ x, y, r, fills, parent }) {
    const circle = figma.createEllipse();
    if (parent)
        parent.appendChild(circle);
    circle.x = x;
    circle.y = y;
    circle.resize(r, r);
    if (fills)
        circle.fills = fills;
    return circle;
}
function clone(val) {
    return JSON.parse(JSON.stringify(val));
}
function setColor(shape, { r, g, b }) {
    const fills = clone(shape.fills);
    fills[0].color.r = r / 255;
    fills[0].color.g = g / 255;
    fills[0].color.b = b / 255;
    shape.fills = fills;
}
