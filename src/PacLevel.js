class PacLevel {
    grid = null;
    gridWidth = 0;
    gridHeight = 0;

    tileSize = 0;
    resolution = 1.5;

    constructor(gridData) {
        this.grid = this.readGrid(gridData);
        this.validateGrid();

        this.addBorders();
        this.numberGrid();

        this.analyzeGrid();
    }

    readGrid(gridData) {
        this.gridWidth = gridData[0].length;
        this.gridHeight = gridData.length;

        return gridData.map((row) => {
            return row.map((tile) =>
                ({
                    isWall: (tile === 1),
                    isTeleport: tile > 1,
                    hasFood: tile === 0,
                    hasPellet: tile === -2,
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
        const createBorderRow = () => new Array(this.gridWidth).fill(0).map(() => ({isWall: true, isBorder: true}));

        this.grid.unshift(createBorderRow());
        this.grid.push(createBorderRow());

        this.grid.forEach((row) => {
            row.unshift({isWall: !row[0].isTeleport, isBorder: true});
            row.push({isWall: !row[row.length - 1].isTeleport, isBorder: true});
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
        // const clusters = [];
        // let clusterIdx = 0, newCluster = [];

        // const propFunc = (tile) => (tile.isWall && !tile.isVisited);
        // const callback = (tile) => {
        //     newCluster.push(tile);
        //     tile.cluster = clusterIdx;
        //     tile.isVisited = true;

        //     
        //     tile.isEdge = tile.neighboringPathways.length > 0;
        // }

        // Create wall clusters & mark neighboring pathways

        // this.grid.forEach((row, rowIdx) => {
        //     row.forEach((tile, colIdx) => {
        //         if (propFunc(tile)) {
        //             callback(tile);
        //             this.traverseByProperty(rowIdx, colIdx, propFunc, callback);

        //             clusters.push(newCluster);
        //             newCluster = [];
        //             clusterIdx++;
        //         }
        //     });
        // });

        // Construct edge loops

        const getNeighboringPathways = (tile) => tile.neighboringPathways || this.getNeighbors(tile.row, tile.col, true).filter((neighbor) => !neighbor.isWall);
        this.grid.forEach((row) => {
            row.forEach((tile) => {
                tile.neighboringPathways = getNeighboringPathways(tile);
                if (tile.neighboringPathways.length > 0) {
                    const neighboringWalls = this.getNeighbors(tile.row, tile.col).filter((neighbor) => neighbor.isWall);
                    tile.connectedWalls = neighboringWalls.filter((wall) => {
                        wall.neighboringPathways = getNeighboringPathways(wall);
                        //!(wall.connectedWalls && wall.connectedWalls.includes(tile)) && // Prevent two-way connections
                        return wall.neighboringPathways.some((pathway) => tile.neighboringPathways.includes(pathway));
                    });

                    const {connectedWalls} = tile;
                    if (connectedWalls.length === 2 && this.isVertical(tile, connectedWalls[0]) !== this.isVertical(tile, connectedWalls[1])) {
                        tile.isCorner = true;
                    }
                }
            });
        });

        // Mark corners

        // this.grid.forEach((row, rowIdx) => {
        //     row.forEach((tile, colIdx) => {
        //         const neighboringWalls = this.getNeighbors(tile.row, tile.col, true).filter((neighbor) => neighbor.isWall);
        //         if (tile.isBorder) {
        //             tile.isCorner = 
        //                 [0, this.gridHeight - 1].includes(rowIdx) && [0, this.gridWidth - 1].includes(colIdx) || // Outer grid corners
        //                 neighboringWalls.length === 4 || // Convex corner
        //                 neighboringWalls.filter((wall) => wall.isBorder).length === 1; // Concave corner
        //         } else {
        //             tile.isCorner = neighboringWalls.length === 3 || (neighboringWalls.length === 7 && this.getNeighbors(tile.row, tile.col, true, true).filter((diagonal) => !diagonal.isWall).length > 0); // Convex corners & concave corners
        //         }
        //     });
        // });

    }

    isVertical(start, end) { 
        return start.col === end.col;
    }

    traverseByProperty(startRow, startCol, propFunc, callback) {
        this.getNeighbors(startRow, startCol).forEach((tile) => {
            if (!propFunc(tile)) return;
            callback(tile);
            this.traverseByProperty(tile.row, tile.col, propFunc, callback);
        });
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

    setupCanvas($canvas) {
        const canvasWidth = $canvas.innerWidth();
        const canvasHeight = $canvas.innerHeight();

        const canvasAspect = canvasWidth / canvasHeight;
        const gridAspect = this.gridWidth / this.gridHeight;

        if (canvasAspect > gridAspect) {
            // Vertically constrained
            this.tileSize = canvasHeight / this.gridHeight;
        } else {
            // Horizontally constrained
            this.tileSize = canvasWidth / this.gridWidth;
        }

        const width = this.tileSize * this.gridWidth;
        const height = this.tileSize * this.gridHeight;
        $canvas
            .attr({
                width: width / this.resolution,
                height: height / this.resolution
            })
            .css({width, height});
    }

    drawSimple($canvas) {
        this.setupCanvas($canvas);
        const ctx = $canvas[0].getContext('2d');

        const getCenter = (tile) => [(tile.col + .5) * this.tileSize / this.resolution, (tile.row + .5) * this.tileSize / this.resolution];

        this.grid.forEach((row, rowIdx) => {
            row.forEach((tile, colIdx) => {
                if (tile.isWall && tile.connectedWalls) {
                    ctx.strokeStyle = '#2121de';
                    ctx.lineWidth = this.tileSize / (6 * this.resolution);
                    ctx.lineCap = 'round';

                    ctx.beginPath();
                    if (tile.isCorner && tile.connectedWalls) {
                        const {connectedWalls} = tile;

                        let verticalWall, horizontalWall;
                        if (this.isVertical(tile, connectedWalls[0])) {
                            verticalWall = connectedWalls[0];
                            horizontalWall = connectedWalls[1];
                        } else {
                            horizontalWall = connectedWalls[0];
                            verticalWall = connectedWalls[1];
                        };

                        const tileCenter = getCenter(tile);

                        let isUpperArc = false, isLeftArc = false;
                        const centerDelta = this.tileSize / (2 * this.resolution);

                        if (verticalWall.row < tile.row) {
                            tileCenter[1] -= centerDelta;
                        }
                        else {
                            tileCenter[1] += centerDelta;
                            isUpperArc = true;
                        }

                        if (horizontalWall.col < tile.col) {
                            tileCenter[0] -= centerDelta;
                            isLeftArc = true;
                        }
                        else {
                            tileCenter[0] += centerDelta;
                        }

                        const quarterArc = Math.PI / 2;
                        let factor = (isUpperArc) ? 
                            (isLeftArc) ? 3 : 2 :
                            (isLeftArc) ? 4 : 1;
                        const arcStart = quarterArc * factor;
                        const arcEnd = arcStart + quarterArc;

                        ctx.arc(...tileCenter, centerDelta, arcStart, arcEnd);
                    } else {
                        tile.connectedWalls.forEach((wall) => {
                            const tileCenter = getCenter(tile);
                            const wallCenter = getCenter(wall);

                            if (wall.isCorner) {
                                wallCenter[0] = (wallCenter[0] + tileCenter[0]) / 2;
                                wallCenter[1] = (wallCenter[1] + tileCenter[1]) / 2;
                            }

                            ctx.moveTo(...tileCenter);
                            ctx.lineTo(...wallCenter);
                        });
                    }
                    ctx.stroke();
                } else if (tile.hasFood || tile.hasPellet) {
                    ctx.fillStyle = '#ffb897';

                    ctx.beginPath();

                    const center = getCenter(tile);
                    if (tile.hasPellet) {
                        ctx.arc(...center, this.tileSize / (this.resolution * 2.5), 0, Math.PI * 2);
                    } else {
                        const size = this.tileSize / (this.resolution * 4.5);
                        ctx.rect(center[0] - size / 2, center[1] - size / 2, size, size);
                    }

                    ctx.fill();
                }
            });
        });
    }

    drawOutlined($canvas) {
        const clusters = [];

        this.grid.forEach((row, rowIdx) => {
            row.forEach((tile, colIdx) => {

            });
        });
    }
}

export default PacLevel;