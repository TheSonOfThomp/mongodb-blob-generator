if (figma.command === 'blobify') {
    blobify();
}
else if (figma.command === 'template') {
    generateTemplate();
}
function generateTemplate() {
    const TEMPLATE_SIZE = 2048;
    const GRID_SIZE = TEMPLATE_SIZE / 4;
    const SpringGreen = { r: 0, g: 237, b: 100 };
    const GrayLight2 = { r: 232, g: 237, b: 235 };
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
        setColor(circle, GrayLight2);
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
    setColor(circle1, SpringGreen);
    setColor(circle2, SpringGreen);
    figma.currentPage.selection = [circle1, circle2];
    figma.closePlugin('Created Blob template');
}
function blobify() {
    // Get selection
    let initialSelection = figma.currentPage.selection;
    if (!initialSelection || initialSelection.length === 0) {
        figma.closePlugin('Please make a selection');
        return;
    }
    // Ensure selection is all Circles or Squaresds
    const areAllCirclesOrSquares = initialSelection.every(shape => isCircle(shape) || isSquare(shape));
    if (!areAllCirclesOrSquares) {
        figma.closePlugin('⚠️ Shapes must all be circles or squares');
        return;
    }
    const selection = [...initialSelection];
    // Ensure all shapes are integer multiples of the smallest shape
    const minWidth = Math.min(...selection.map(({ width }) => width));
    const maxWidth = Math.max(...selection.map(({ width }) => width));
    const minX = Math.min(...selection.map(({ x }) => x));
    const minY = Math.min(...selection.map(({ y }) => y));
    const areAllIntegerMultiples = selection.every(({ width }) => width === minWidth || width === 2 * minWidth || width === 3 * minWidth || width === 4 * minWidth);
    if (!areAllIntegerMultiples) {
        figma.closePlugin('⚠️ Shapes must all be integer multiples of each other');
        return;
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
    // For each rectangle, add a corner radius on each corner with no adjacent rectangles
    selection.forEach((shape) => {
        const radius = shape.width / 2;
        // Check if any other shape overlaps this one
        const ajcs = getAdjacencies(shape, selection);
        if (!ajcs.top && !ajcs.left) {
            shape.topLeftRadius = radius;
        }
        if (!ajcs.top && !ajcs.right) {
            shape.topRightRadius = radius;
        }
        if (!ajcs.bottom && !ajcs.left) {
            shape.bottomLeftRadius = radius;
        }
        if (!ajcs.bottom && !ajcs.right) {
            shape.bottomRightRadius = radius;
        }
    });
    // Union all shapes
    const union = figma.union(selection, selection[0].parent);
    // Add corner radius to all other corners
    union.cornerRadius = maxWidth;
    // Add fills
    union.fills = selection[0].fills;
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
function getAdjacencies(shape, otherShapes) {
    const adjacencies = {
        top: false,
        bottom: false,
        left: false,
        right: false
    };
    for (let other of otherShapes) {
        if (other === shape)
            continue;
        if (doShapesShareY(shape, other)) {
            if (isRoughlyEqual(shape.x, other.x + other.width)) {
                adjacencies.left = true;
            }
            if (isRoughlyEqual(shape.x + shape.width, other.x)) {
                adjacencies.right = true;
            }
        }
        if (doShapesShareX(shape, other)) {
            if (isRoughlyEqual(shape.y, other.y + other.height)) {
                adjacencies.top = true;
            }
            if (isRoughlyEqual(shape.y + shape.height, other.y)) {
                adjacencies.bottom = true;
            }
        }
    }
    return adjacencies;
    function doShapesShareX(shape1, shape2, includeDiagonals = true) {
        return isRoughlyEqual(shape1.x, shape2.x) ||
            isRoughlyEqual(shape1.x + shape1.width, shape2.x + shape2.width) ||
            (includeDiagonals && isRoughlyEqual(shape1.x + shape1.width, shape2.x)) || // include diagonal adjacencies
            (includeDiagonals && isRoughlyEqual(shape1.x, shape2.x + shape2.width));
    }
    function doShapesShareY(shape1, shape2, includeDiagonals = true) {
        return isRoughlyEqual(shape1.y, shape2.y) ||
            isRoughlyEqual(shape1.y + shape1.height, shape2.y + shape2.height) ||
            (includeDiagonals && isRoughlyEqual(shape1.y + shape1.height, shape2.y)) || // include diagonal adjacencies
            (includeDiagonals && isRoughlyEqual(shape1.y, shape2.y + shape2.height));
    }
    function isRoughlyEqual(a, b, tolerance = 2) {
        return (a == b) ||
            (a > b && a <= b + tolerance) ||
            (a < b && a + tolerance >= b);
    }
}
