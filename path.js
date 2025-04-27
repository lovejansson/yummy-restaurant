import "./array.js"

/**
 * @typedef Cell 
 * @property {number} row
 * @property {number} col
 */


/** 
* @param {Cell} cell 
*/
const getNeighbours = (cell, rows, cols) => {

    let neighbours = [];

    for(const [r, c] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
        const neighbour = {row: cell.row + r, col: cell.col + c};

        if(neighbour.row !== -1 && neighbour.row !== rows && neighbour.col !== -1 && neighbour.col !== cols) neighbours.push(neighbour);      
    }

    return neighbours;
}

/**
 * Creates the closest path in the grid using A*algorithm 
 *  
 * @param {Cell} start 
 * @param {Cell} end
 * @param {any[][]} grid 
 * @returns {Cell[]} path, array of grid cells 
 * 
 */
function createPath(start, end, grid) {
    if(grid[end.row][end.col] === 1) throw new Error("End cell is a non walkable cell")

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
        
        const neighbours = getNeighbours(curr, grid.length, grid[0].length);

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

export {drawGrid, createGrid, createPath};