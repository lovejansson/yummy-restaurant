import "./array.js"

/**
 * @typedef Cell 
 * @property {number} row
 * @property {number} col
 */


/** 
* @param {Cell} cell 
* @param {number[][]} grid
*/
const getNeighbours = (cell, grid, includeDiagonalNeighbours = false) => {
  
    const rows = grid.length;
    const cols = grid[0].length;
    const neighbours = [];

    const neighbourDiffs = includeDiagonalNeighbours ? 
        [
        [-1, -1], [-1, 0], [-1, 1], 
        [0, -1],     [0, 1], 
        [1, -1], [1, 0], [1, 1]] 
        : 
        [[-1, 0], [0, 1], [1, 0], [0, -1]]

    for(const [r, c] of neighbourDiffs) {
        const n = {row: cell.row + r, col: cell.col + c};
        if(n.row !== -1 && n.col !== -1 && n.row !== rows && n.col !== cols) neighbours.push(n);     
    }

    return neighbours;
}

/**
 * 
 * Creates the closest path in the grid using Breadth first search algorithm (BFS)
 *  
 * @param {Cell} start 
 * @param {Cell} end
 * @param {number[][]} grid each cell stores either 1 or 0, depending on if it is a walkable cell or not.
 * @returns {Cell[]} path, array of grid cells 
 * 
 */
function createPathBFS(start, end, grid) {

    const rows = grid.length;
    const cols = grid.length[0];
    
    const reconstructPath = (pathMap) => {

        let curr = end;

        let path = [end];
        // console.log(pathMap)
        
        while (!(curr.row === start.row && curr.col === start.col)) {
          
            curr = pathMap[curr.row][curr.col];
            path.push(curr);
        }

        return path.reverse();
    }

    const visited = createGrid(rows, cols, false);
    const path = createGrid(rows, cols);
    const queue = []; 

    let curr;

    queue.push(start);
    path[start.row][start.col] = null;
    visited[start.row][start.col] = true;

    while (queue.length > 0) {

      curr = queue.shift();

      for (const n of getNeighbours(curr, grid)) {

        if (n.row === end.row && n.col === end.col) {
            path[n.row][n.col] = curr;
            break;

        } else if (!visited[n.row][n.col]) {
            queue.push(n);
            path[n.row][n.col] = curr;
            visited[n.row][n.col] = curr;
        }
      }
    }

    return reconstructPath(path);
}

/**
 * Creates the closest path in the grid using A*algorithm 
 *  
 * @param {Cell} start 
 * @param {Cell} end
 * @param {any[][]} grid
 * @param {number[]} [walkableTileValues] a list of what values non walkable cells have
 * @returns {Cell[]} path, array of grid cells 
 * 
 */
function createPathAStar(start, end, grid, walkableTileValues = [0]) {
    //  console.debug("Creating path from " + JSON.stringify(start) + " to " + JSON.stringify(end));
      console.debug(grid[start.row][start.col], grid[end.row][end.col]);


    if(grid[start.row][start.col] === 1) throw new Error(`Start cell is a non walkable cell: ${start.row}:${start.col}`);
    if(grid[end.row][end.col] === 1) throw new Error(`End cell is a non walkable cell. ${end.row}:${end.col}`);

    const rows = grid.length;
    const cols = grid[0].length;

    const heuristic = (curr, to) => Math.abs(curr.row - to.row) + Math.abs(curr.col - to.col);

    const reconstructPath = (pathMap) => {

        let curr = end;
        let path = [end];
    
        while (curr !== null) {
            curr = pathMap[curr.row][curr.col];
            if(curr) {
                path.push(curr);
            }
          
        }

        return path.reverse();
    }

    const openList = [start];
    const closeList = [];

    // Keeps track of where we came from for each cell
    const pathMap = createGrid(rows, cols);

    // Keeps track of lowest scores for the cells (f = g + h)
    const scoresMap = createGrid(rows, cols, 100000); 

    scoresMap[start.row][start.col] = 0;

    let curr;

    while(openList.length > 0) {
     
        // Find cell with lowest score in the openList bc this is the most optimal path to take
        curr = openList.reduce((optimalCell, curr) => {
            if(optimalCell === undefined 
                || scoresMap[curr.row][curr.col] < scoresMap[optimalCell.row][optimalCell.col]) {
                return curr;
            }

            return optimalCell;

        }, undefined);

        // We reached the end cell
        if(curr.row === end.row && curr.col === end.col) break;

        const neighbours = getNeighbours(curr, grid, true);

        const g = scoresMap[curr.row][curr.col] + 1; 

        for(const n of neighbours) {

           
            if(grid[n.row][n.col] === 1) continue //
            const h = heuristic(n, end);
            const f = g + h;

            const cellInClosedList = closeList.find(c => c.row === n.row && c.col === n.col);
            const cellInOpenedList = openList.find(c => c.row === n.row && c.col === n.col);

            if (cellInOpenedList && scoresMap[cellInOpenedList.row][cellInOpenedList.col] < f) {
                continue;
            } else if (cellInClosedList && scoresMap[cellInClosedList.row][cellInClosedList.col] < f)  {
                continue;
            } else {
                if(cellInOpenedList === undefined) openList.push(n); 
                scoresMap[n.row][n.col] = f;
                pathMap[n.row][n.col] = curr;
                // Vi kommer inte in hit för att lägga till pathmap[end.row][end.col]
            }
        }

        openList.remove(curr);
        closeList.push(curr);
    }

    if(pathMap[end.row][end.col] === null) {
        // console.log(pathMap)
        // console.log(grid)
        // console.log(start)
        // console.log(end)
        throw Error("Invalid path")}
    return reconstructPath(pathMap);
}


/**
 * Creates a grid which is a 2D array with any value you like.
 * 
 * @param {number} rows 
 * @param {number} cols 
 * @param {any} defaultCellValue 
 * @returns {any[][]}
 */
function createGrid(rows, cols, defaultCellValue = null) {
    const grid = [];
    for(let r = 0; r < rows; ++r) {
        const row = [];
        for(let c = 0; c < cols; ++c) {
            const value =  defaultCellValue;
            row.push(value);
        }
        grid.push(row);
    }

    return grid;
}


/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} rows 
 * @param {number} cols
 * @param {number} cellSize
 */
function drawGrid(ctx, rows, cols, cellSize, offsetX = 0, offsetY = 0, strokeColor = "black", fillColor = "white") {

    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;

    const translateOffset = 0.5;

    for(let r = 0; r < rows; ++r) {
        for (let c = 0; c < cols; ++c) {

            ctx.moveTo((c * cellSize + translateOffset) + offsetX, r * cellSize + translateOffset + offsetY);
            ctx.lineTo((c + 1) * cellSize + translateOffset + offsetX, r * cellSize + translateOffset + offsetY);
            ctx.lineTo((c + 1) * cellSize + translateOffset + offsetX,(r + 1) * cellSize+  translateOffset + offsetY);
            ctx.lineTo(c * cellSize + translateOffset + offsetX, (r + 1) * cellSize + translateOffset + offsetY);
            ctx.lineTo(c * cellSize + translateOffset + offsetX,  r * cellSize + translateOffset + offsetY);

            
        }
    }

    ctx.stroke();
}

export { drawGrid, createGrid, createPathAStar, createPathBFS };