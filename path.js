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
const getNeighbours = (cell, grid) => {
  
    const rows = grid.length;
    const cols = grid[0].length;

    const neighbours = [];

    for(const [r, c] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
        const neighbour = {row: cell.row + r, col: cell.col + c};
      
        if(neighbour.row !== -1 && neighbour.col !== -1 && neighbour.row !== rows -1 && neighbour.col !== cols -1 && grid[neighbour.row][neighbour.col] === 0) neighbours.push(neighbour);     
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
        console.log(pathMap)
        
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
 * @param {any[][]} grid ()
 * @returns {Cell[]} path, array of grid cells 
 * 
 */
function createPathAStar(start, end, grid) {

    if(grid[start.row][end.row] === 1 || grid[end.row][end.col] === 1) throw new Error("Start cell is a non walkable cell.");
    if(grid[end.row][end.col] === 1) throw new Error("End cell is a non walkable cell.");

    const rows = grid.length;
    const cols = grid[0].length;

    const heuristic = (curr, to) => Math.abs(curr.row - to.row) + Math.abs(curr.col - to.col);

    const reconstructPath = (pathMap) => {

        let curr = end;

        let path = [end];

        while (!(curr.row === start.row && curr.col === start.col)) {
           
            curr = pathMap[curr.row][curr.col];
            path.push(curr);
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
        curr = openList.reduce((cellMinScore, curr) => {
            if(cellMinScore === undefined 
                || scoresMap[curr.row][curr.col] < scoresMap[cellMinScore.row][cellMinScore.col]) {
                return curr;
            }

            return cellMinScore;

        }, undefined);

        // We reached the end cell
        if(curr.row === end.row && curr.col === end.col) break;
        
        const neighbours = getNeighbours(curr, grid);

        const g = scoresMap[curr.row][curr.col] + 1; 

        for(const n of neighbours) {

            if(grid[n.row][n.col] === 1 ) continue; // obsticle cell 

            const h = heuristic(n, end);
            const f = g + h;

            const cellInClosedList = closeList.find(c => c.row === n.row && c.col === n.col);
            const cellInOpenedList = openList.find(c => c.row === n.row && c.col === n.col);

            if (cellInOpenedList && scoresMap[cellInOpenedList.row][cellInOpenedList.col] < f) {
                continue;
            } else if (cellInClosedList && scoresMap[cellInClosedList.row][cellInClosedList.col] < f)  {
                continue;
            } else {
       
                if(!cellInOpenedList) openList.push(n); 
                scoresMap[n.row][n.col] = f;
                pathMap[n.row][n.col] = curr;
            }
        }

        openList.remove(curr);
        closeList.push(curr);
    }

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
function drawGrid(ctx, rows, cols, cellSize, strokeColor = "black", fillColor = "white") {

    ctx.beginPath();

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;

    for(let r = 0; r < rows; ++r) {
        for (let c = 0; c < cols; ++c) {

            ctx.moveTo(c * cellSize, r * cellSize);
            ctx.lineTo((c + 1) * cellSize, r * cellSize);
            ctx.lineTo((c + 1) * cellSize,(r + 1) * cellSize);
            ctx.lineTo(c * cellSize, (r + 1) * cellSize);
            ctx.lineTo(c * cellSize,  r * cellSize);
        }
    }

    ctx.stroke();
}

export {drawGrid, createGrid, createPathAStar, createPathBFS};