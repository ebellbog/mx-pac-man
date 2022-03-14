class PacLevel {

    constructor(gridData, $canvas) {
        this.declarePublicFields();

        this.grid = this.readGrid(gridData);
        this.validateGrid();

        this.addBorders();
        this.numberGrid();

        this.analyzeGrid();

        this.$canvas = $canvas;
        $(window).on('resize', () => {
            this.setupCanvas();
        });
        this.setupCanvas();

        this.startAnimating();
    }

    // For compatibility with older browsers that don't support public class fields
    declarePublicFields() {
        this.grid = null;
        this.gridWidth = 0;
        this.gridHeight = 0;

        this.tileSize = 0;
        this.resolution = 1.3;

        this.edgeLoops = {};

        this.pacMan = {
            progress: 0,
            speed: .13
        }
    }

    readGrid(gridData) {
        this.gridWidth = gridData[0].length;
        this.gridHeight = gridData.length;

        return gridData.map((row) => {
            return row.map((tile) =>
                ({
                    isWall: tile === 1,
                    isPathway: tile !== 1,
                    isTeleport: (tile > 1) ? tile : false,
                    hasFood: (tile === 0) ? 1 : 0,
                    hasPellet: (tile === -2) ? 1 : 0,
                })
            );
        });
    }

    validateGrid() {
        this.grid.forEach((row) => {
            if (row.length !== this.gridWidth) throw `Inconsistent grid width: Is ${row.length}, should be ${this.gridWidth}`;
        });
    }

    addBorders() {
        // Important to ensure every object is unique in memory - hence fill + map, instead of just fill
        const createBorderRow = () => new Array(this.gridWidth).fill(0).map(() => ({isWall: true}));

        this.grid.unshift(createBorderRow());
        this.grid.push(createBorderRow());

        this.grid.forEach((row) => {
            const newTile = {};

            const createBorderTile = (oldTile) => {
                const newTile = {};
                if (oldTile.isTeleport) {
                    newTile.isTeleport = oldTile.isTeleport;
                    newTile.isPathway = true;
                    oldTile.isTeleport = false;
                } else {
                    newTile.isWall = true;
                }
                return newTile;
            }

            row.unshift(createBorderTile(row[0]));
            row.push(createBorderTile(row[row.length - 1]));
        });

        this.gridHeight += 2;
        this.gridWidth += 2;
    }

    numberGrid() {
        this.grid.forEach((row, rowIdx) => {
            row.forEach((tile, colIdx) => {
                tile.row = rowIdx;
                tile.col = colIdx;
            });
        });
    }

    analyzeGrid() { 
        // Find edge loops by traversing grid sequentially, then taking a recursive detour whenever we reach a new edge

        const getNeighboringPathways = (tile) => tile.neighboringPathways || this.getNeighbors(tile.row, tile.col, true).filter((neighbor) => neighbor.isPathway);

        this.grid.forEach((row) => {
            row.forEach((tile) => {
                if (!tile.isWall || tile.isVisited) return;

                tile.neighboringPathways = getNeighboringPathways(tile); // Only inspect "outer" walls, adjacent to pathways, which form the edge loop around a wall cluster
                if (!tile.neighboringPathways.length) return;

                this.edgeLoops[hashTile(tile)] = tile; // Cache first edge of each loop, for later rendering

                const startingTile = tile;

                while (tile && !tile.isVisited) {
                    tile.isVisited = true;

                    const neighoringWalls = this.getNeighbors(tile.row, tile.col).filter((neighbor) => neighbor.isWall); // All walls in orthogonal directions
                    tile.nextEdge = neighoringWalls.filter((wall) => {
                        if (wall.nextEdge === tile) return; // This was actually the previous wall in the edge loop, so don't backtrack

                        wall.neighboringPathways = getNeighboringPathways(wall);
                        return wall.neighboringPathways.some((pathway) => tile.neighboringPathways.includes(pathway)); // Test for edge adjacency (i.e. two edges bordering on the same path tile)
                    })[0]; // The starting point in a loop will have two possible edges; choose only one


                    // Prevent redundant start points for non-looping loops
                    if (tile === startingTile && this.edgeLoops[hashTile(tile.nextEdge)])
                        delete this.edgeLoops[hashTile(tile.nextEdge)];

                    tile = tile.nextEdge;
                }

                startingTile.isLoop = startingTile === tile;
            });
        });

        this.edgeLoops = Object.values(this.edgeLoops);
    }

    getNeighbors(row, col, includeDiagonals, onlyDiagonals) {
        const neighbors = [];
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i === 0 && j === 0) continue; // Skip self
                if (!(i === 0 || j === 0)) { // Is diagonal
                    if (!includeDiagonals) continue;
                } else if (onlyDiagonals) continue;

                const neighborRow = row + i;
                const neighborCol = col + j;

                // Test grid bounds
                if (neighborRow < 0 || neighborRow >= this.gridHeight
                    || neighborCol < 0 || neighborCol >= this.gridWidth)
                    continue;

                const tile = this.grid[neighborRow][neighborCol];
                neighbors.push(tile);
            }
        }
        return neighbors;
    }

    setupCanvas() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const screenAspect = screenWidth / screenHeight;
        const gridAspect = this.gridWidth / this.gridHeight;

        if (screenAspect > gridAspect) {
            // Vertically constrained
            this.tileSize = screenHeight / this.gridHeight;
            this.$canvas.css({
                height: '93vh',
                width: 'auto',
            });
        } else {
            // Horizontally constrained
            this.tileSize = screenWidth / this.gridWidth;
            this.$canvas.css({
                height: 'auto',
                width: '93vw',
            });
        }

        const width = this.tileSize * this.gridWidth;
        const height = this.tileSize * this.gridHeight;
        this.$canvas
            .attr({
                width: width / this.resolution,
                height: height / this.resolution
            });
    }

    render() {
        const ctx = this.$canvas[0].getContext('2d');

        const getCenter = (tile) => [(tile.col + .5) * this.tileSize / this.resolution, (tile.row + .5) * this.tileSize / this.resolution];
        const isCorner = (tile) => tile.nextEdge && tile.nextEdge.nextEdge && isVertical(tile, tile.nextEdge) !== isVertical(tile.nextEdge, tile.nextEdge.nextEdge);
        const drawEdge = (tile) => {
            if (isCorner(tile)) {
                // Corners will always have one vertical edge and one horizontal edge that meet
                // Here we determine which is which
                let verticalWall, horizontalWall;
                if (isVertical(tile, tile.nextEdge)) {
                    verticalWall = tile;
                    horizontalWall = tile.nextEdge.nextEdge;
                } else {
                    horizontalWall = tile;
                    verticalWall = tile.nextEdge.nextEdge;
                };

                const tileCenter = getCenter(tile.nextEdge);
                const centerDelta = this.tileSize / (2 * this.resolution); // Distance to shift center of arc, for drawing rounded corners

                let isUpperArc = false, isLeftArc = false;

                // Determine upper vs lower corner
                if (verticalWall.row < tile.nextEdge.row) {
                    tileCenter[1] -= centerDelta;
                }
                else {
                    tileCenter[1] += centerDelta;
                    isUpperArc = true;
                }

                // Determine left vs right corner
                if (horizontalWall.col < tile.nextEdge.col) {
                    tileCenter[0] -= centerDelta;
                }
                else {
                    tileCenter[0] += centerDelta;
                    isLeftArc = true;
                }

                // Set angles based on quadrant
                const quarterArc = Math.PI / 2;
                let factor = (isUpperArc) ?
                    (isLeftArc) ? 2 : 3 :
                    (isLeftArc) ? 1 : 4;

                let arcStart = quarterArc * factor;
                let arcEnd = arcStart + quarterArc;

                let isCounterClockwise = (isUpperArc) ?
                    tile.col > tile.nextEdge.nextEdge.col :
                    tile.col < tile.nextEdge.nextEdge.col;
                if (isCounterClockwise) {
                    [arcStart, arcEnd] = [arcEnd, arcStart];
                }
                ctx.arc(...tileCenter, centerDelta, arcStart, arcEnd, isCounterClockwise);
            } else {
                ctx.lineTo(...getCenter(tile.nextEdge));
            }
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, this.gridHeight * this.tileSize / this.resolution);
        gradient.addColorStop(0, 'cyan');
        gradient.addColorStop(0.25, '#ff9797');
        gradient.addColorStop(.5, 'white');
        gradient.addColorStop(0.75, '#ff9797');
        gradient.addColorStop(1, 'cyan');

        ctx.strokeStyle = 'white';
        ctx.lineWidth = this.tileSize / (6 * this.resolution);
        ctx.lineCap = 'round';

        // Draw walls

        this.edgeLoops.forEach((startingEdge) => {
            const startingCenter = getCenter(startingEdge);
            const centerDelta = this.tileSize / (2 * this.resolution);

            if (startingEdge.isLoop) {
                if (!isVertical(startingEdge, startingEdge.nextEdge)) {
                    startingCenter[0] += centerDelta;
                } else {
                    startingCenter[1] -= centerDelta;
                }
            }

            ctx.beginPath();
            ctx.moveTo(...startingCenter);

            let currentEdge = startingEdge;

            const didDraw = {};
            while (currentEdge.nextEdge && !didDraw[hashTile(currentEdge)]) {
                drawEdge(currentEdge);
                didDraw[hashTile(currentEdge)] = true;
                currentEdge = currentEdge.nextEdge;
            }

            if (currentEdge === startingEdge) {
                ctx.globalAlpha = 0.75;
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            ctx.stroke();
        });

        // Draw food & pellets

        let remainingEdibles = 0;
        this.grid.forEach((row) => {
            row.forEach((tile) => {
                if (tile.hasFood === 1 || tile.hasPellet === 1) {
                    remainingEdibles++;
                    ctx.beginPath();

                    const center = getCenter(tile);
                    if (tile.hasPellet === 1) {
                        if (Math.floor(Date.now() / 350) % 2)
                            ctx.arc(...center, this.tileSize / (this.resolution * 2.5), 0, Math.PI * 2);
                    } else {
                        const size = this.tileSize / (this.resolution * 4.5);
                        ctx.rect(center[0] - size / 2, center[1] - size / 2, size, size);
                    }

                    ctx.fillStyle = '#ffb897';
                    ctx.fill();
                }
            });
        });
        if (remainingEdibles === 0) this.resetLevel();

        // Draw Mx. Pac-Man

        const {startTile, destTile} = this.pacMan;
        const mouthAngle = Math.abs(Math.sin(Date.now() / 80));

        let rotation;
        if (startTile.row > destTile.row) rotation = -Math.PI / 2;
        else if (startTile.row < destTile.row) rotation = Math.PI / 2;
        else rotation = (startTile.col < destTile.col) ? 0 : Math.PI;

        const startAngle = mouthAngle + rotation;
        const endAngle = Math.PI * 2 - mouthAngle + rotation;

        const startCenter = getCenter(startTile);
        const destCenter = getCenter(destTile);
        const {progress} = this.pacMan;

        const interpolate = (start, dest, progress) => start * (1 - progress) + dest * progress;
        const center = [0, 1].map((idx) => interpolate(startCenter[idx], destCenter[idx], progress));

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.moveTo(...center)
        ctx.arc(...center, this.tileSize / (1.4 * this.resolution), startAngle, endAngle);
        ctx.lineTo(...center);
        ctx.fill();
    }

    update() {
        if (this.pacMan.progress < 1) this.pacMan.progress += this.pacMan.speed;
        else {
            let {destTile} = this.pacMan;

            // Eat food & pellets, while tracking which tiles previously contained them
            destTile.hasFood = -Math.abs(destTile.hasFood);
            destTile.hasPellet = -Math.abs(destTile.hasPellet);

            // Find matching teleport
            if (destTile.isTeleport > 1) {
                destTile = this.findMatchingTeleport(destTile) || destTile;
            }

            const {row, col} = destTile;
            const newDest = getRandomItem(this.getNeighbors(row, col).filter((tile) => tile.isPathway && tile !== this.pacMan.startTile));
            [this.pacMan.startTile, this.pacMan.destTile] = [destTile, newDest || this.pacMan.startTile];
            this.pacMan.progress = 0;
        }
    }

    findMatchingTeleport(startTile) {
        for (let i = 0; i < this.gridHeight; i++) {
            for (let j = 0; j < this.gridWidth; j++) {
                const tile = this.grid[i][j];
                if (tile !== startTile && tile.isTeleport === startTile.isTeleport) return tile;
            }
        }
        return null;
    }

    startAnimating() {
        this.pacMan.startTile = this.grid[23][14];
        this.pacMan.destTile = this.grid[23][15];

        const ctx = this.$canvas[0].getContext('2d');
        const animate = () => {
            ctx.clearRect(0, 0, this.$canvas.attr('width'), this.$canvas.attr('height'));
            this.render();
            this.update();
            window.requestAnimationFrame(animate);
        }
        animate();
    }

    resetLevel() {
        this.grid.forEach((row) => {
            row.forEach((tile) => {
                // If previously held food or pellet, these values will be -1 and get reset to 1 (ie true)
                tile.hasPellet = Math.abs(tile.hasPellet);
                tile.hasFood = Math.abs(tile.hasFood);
            });
        });
    }

}

function isVertical(start, end) { 
    return (start && end && start.col === end.col);
}

function hashTile (tile) {
    return (tile) ? `${tile.row}_${tile.col}` : null;
}

function getRandInt(min, max) {
    return min + Math.round(Math.random() * (max - min));
}

function getRandomItem(items) {
    return items[getRandInt(0, items.length - 1)];
}

export default PacLevel;