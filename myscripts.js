let cellElements = []; // 2D array to store cell references

document.addEventListener("DOMContentLoaded", function () {
  // Dark mode based on preference
  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (prefersDarkMode) {
    document.body.classList.add("dark");
    darkModeToggle.checked = true;
  } else {
    document.body.classList.add("light");
  }
  darkModeToggle.addEventListener("change", function () {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
  });

  // Tabs
  const tabs = document.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('[role="tabpanel"]');
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      panels.forEach((p) => p.classList.add("hidden"));

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      const panelId = tab.getAttribute("aria-controls");
      document.getElementById(panelId).classList.remove("hidden");
    });
  });

  // Blog articles
  const blogButtons = document.querySelectorAll(".blog-btn");
  const blogModal = document.getElementById("blogModal");
  const modalOverlay = document.getElementById("modalOverlay");
  const closeModal = document.getElementById("closeModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  blogButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const blogId = btn.getAttribute("data-blog");
      const articleTitle = btn
        .closest(".blog-card")
        .querySelector("h3").textContent;
      modalTitle.textContent = articleTitle;
      modalContent.innerHTML = getBlogContent(blogId);
      blogModal.classList.remove("hidden");

      blogModal.querySelector(".relative").style.animation =
        "fade-in 0.3s ease-out";
    });
  });
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      blogModal.classList.add("hidden");
    });
  }
  if (modalOverlay) {
    modalOverlay.addEventListener("click", () => {
      blogModal.classList.add("hidden");
    });
  }

  // Activate the blog tab if the URL hash is "#blog"
  if (window.location.hash === "#blog") {
    const blogTab = document.getElementById("blogTab");
    if (blogTab) {
      blogTab.click(); // Activate the blog tab
      // Remove the hash from the URL so it won't persist on refresh
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }

  // Initialize Sudoku
  initSudokuSolver();
});

function getBlogContent(blogId) {
  switch (blogId) {
    case "basic":
      return `<p class="lead">For beginners, basic scanning and single-candidate techniques go a long way!</p>`;
    case "advanced":
      return `<p class="lead">Advanced strategies like X-Wing, Swordfish, and more can help crack tough puzzles.</p>`;
    case "larger":
      return `<p class="lead">Larger grids (16×16+) require systematic notation and extended strategies.</p>`;
    case "algorithms":
      return `<p class="lead">Sudoku solvers use backtracking, constraint propagation, and intelligent heuristics.</p>`;
    case "creation":
      return `<p class="lead">Puzzle creation involves ensuring uniqueness, difficulty grading, and balanced clues.</p>`;
    case "history":
      return `<p class="lead">From "Number Place" origins in the US to "Sudoku" mania in Japan, the puzzle soared globally.</p>`;
    default:
      return `<p>Content under construction...</p>`;
  }
}

// State for Sudoku
let currentSize = 9;
let currentGrid = [];
let activeCell = null;
let solutionInProgress = false;
let solveStartTime = null;

// Faster solver animation
let animationSpeed = 5;

function initSudokuSolver() {
  const gridSizeSelect = document.getElementById("gridSize");
  const exampleBtn = document.getElementById("exampleBtn");
  const solveBtn = document.getElementById("solveBtn");
  const clearBtn = document.getElementById("clearBtn");
  const checkBtn = document.getElementById("checkBtn");
  const importBtn = document.getElementById("importBtn");
  const processImportBtn = document.getElementById("processImportBtn");
  const cancelImportBtn = document.getElementById("cancelImportBtn");
  const printBtn = document.getElementById("printBtn");

  gridSizeSelect.addEventListener("change", function () {
    currentSize = parseInt(this.value);
    createGrid();
  });

  exampleBtn.addEventListener("click", loadExample);
  solveBtn.addEventListener("click", solvePuzzle);
  clearBtn.addEventListener("click", clearGrid);
  checkBtn.addEventListener("click", checkValidity);

  // Import
  importBtn.addEventListener("click", () => {
    document.getElementById("importOptions").classList.toggle("hidden");
  });
  processImportBtn.addEventListener("click", importPuzzle);
  cancelImportBtn.addEventListener("click", () => {
    document.getElementById("importOptions").classList.add("hidden");
  });

  // Print
  printBtn.addEventListener("click", () => {
    window.print();
  });

  currentSize = parseInt(gridSizeSelect.value);
  createGrid();
}

function createGrid() {
  // Reset current grid and cache
  currentGrid = Array(currentSize)
    .fill()
    .map(() => Array(currentSize).fill(0));
  cellElements = [];

  // Determine subgrid dimensions
  let subgridWidth, subgridHeight;
  if (currentSize === 4) {
    subgridWidth = subgridHeight = 2;
  } else if (currentSize === 6) {
    subgridWidth = 3;
    subgridHeight = 2;
  } else if (currentSize === 8) {
    subgridWidth = 4;
    subgridHeight = 2;
  } else if (currentSize === 9) {
    subgridWidth = subgridHeight = 3;
  } else if (currentSize === 10) {
    subgridWidth = 5;
    subgridHeight = 2;
  } else if (currentSize === 12) {
    subgridWidth = 4;
    subgridHeight = 3;
  } else if (currentSize === 16) {
    subgridWidth = subgridHeight = 4;
  }

  const container = document.getElementById("sudokuContainer");
  container.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "sudoku-grid";

  const cellSize = Math.min(
    Math.floor((window.innerWidth * 0.8) / currentSize),
    50
  );
  grid.style.gridTemplateColumns = `repeat(${currentSize}, ${cellSize}px)`;
  grid.style.gridTemplateRows = `repeat(${currentSize}, ${cellSize}px)`;

  for (let row = 0; row < currentSize; row++) {
    const rowCells = [];
    for (let col = 0; col < currentSize; col++) {
      const cell = document.createElement("div");
      cell.className = "sudoku-cell";
      cell.dataset.row = row;
      cell.dataset.col = col;

      // Apply border classes for subgrid separation
      if ((col + 1) % subgridWidth === 0 && col < currentSize - 1) {
        cell.classList.add("border-bold-right");
      }
      if ((row + 1) % subgridHeight === 0 && row < currentSize - 1) {
        cell.classList.add("border-bold-bottom");
      }

      // const input = document.createElement("input");
      // input.type = "text";
      // input.maxLength = currentSize > 9 ? 2 : 1;
      // input.readOnly = false;
      const input = document.createElement("input");
input.type = "text";
input.inputMode = "numeric"; // Suggests a numeric keypad on mobile
input.pattern = "[0-9]*";    // Helps mobile browsers validate numeric input
input.maxLength = currentSize > 9 ? 2 : 1;
input.readOnly = false;


      // Attach event listeners
      cell.addEventListener("click", function () {
        if (solutionInProgress) return;
        if (activeCell) activeCell.classList.remove("active");
        activeCell = this;
        this.classList.add("active");
        highlightRelatedCells(row, col);
      });

      input.addEventListener("input", function () {
        if (solutionInProgress) return;
        let val = this.value.trim();
        if (!val) {
          currentGrid[row][col] = 0;
          cell.classList.remove("invalid");
          return;
        }
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1 || num > currentSize) {
          this.value = "";
          currentGrid[row][col] = 0;
          cell.classList.add("shake");
          setTimeout(() => cell.classList.remove("shake"), 500);
        } else {
          currentGrid[row][col] = num;
          input.classList.add("original");
          validateCell(row, col, num);
        }
      });

      cell.appendChild(input);
      grid.appendChild(cell);
      rowCells.push(cell); // Cache the cell element
    }
    cellElements.push(rowCells);
  }

  container.appendChild(grid);
  activeCell = null;
  showStatus("", false);
}

function loadExample() {
  clearGrid(() => {
    // We'll modify clearGrid() to accept a callback (see below)
    let example;
    switch (currentSize) {
      case 9: // Standard 9×9 puzzle
        example = [
          [5, 3, 0, 0, 7, 0, 0, 0, 0],
          [6, 0, 0, 1, 9, 5, 0, 0, 0],
          [0, 9, 8, 0, 0, 0, 0, 6, 0],
          [8, 0, 0, 0, 6, 0, 0, 0, 3],
          [4, 0, 0, 8, 0, 3, 0, 0, 1],
          [7, 0, 0, 0, 2, 0, 0, 0, 6],
          [0, 6, 0, 0, 0, 0, 2, 8, 0],
          [0, 0, 0, 4, 1, 9, 0, 0, 5],
          [0, 0, 0, 0, 8, 0, 0, 7, 9],
        ];
        break;
      case 4:
        example = [
          [0, 1, 0, 0],
          [0, 3, 0, 0],
          [0, 0, 4, 0],
          [0, 0, 0, 2],
        ];
        break;
      case 6: // Pre-defined 6×6 puzzle (using 2×3 subgrids)
        example = [
          [0, 2, 0, 6, 0, 4],
          [6, 0, 4, 0, 2, 0],
          [0, 4, 0, 0, 0, 2],
          [2, 0, 0, 0, 4, 0],
          [0, 0, 2, 0, 0, 6],
          [4, 0, 6, 0, 0, 0],
        ];
        break;
      case 8: // Pre-defined 8×8 puzzle (using 2×4 subgrids)
        example = [
          [1, 0, 0, 4, 0, 6, 0, 8],
          [0, 0, 6, 0, 0, 0, 2, 0],
          [0, 7, 0, 8, 0, 0, 6, 3],
          [0, 0, 2, 0, 4, 0, 0, 0],
          [0, 6, 0, 0, 0, 0, 7, 0],
          [8, 0, 0, 2, 0, 0, 0, 5],
          [0, 0, 0, 0, 0, 8, 0, 0],
          [0, 3, 0, 0, 5, 0, 0, 7],
        ];
        break;
      case 10: // Pre-defined 10×10 puzzle (using 2×5 subgrids)
        example = [
          [0, 3, 0, 7, 0, 0, 8, 0, 0, 5],
          [5, 0, 0, 0, 9, 0, 0, 0, 0, 0],
          [0, 0, 4, 0, 0, 1, 0, 7, 0, 0],
          [0, 6, 0, 0, 0, 0, 0, 0, 9, 0],
          [7, 0, 0, 0, 0, 0, 0, 0, 0, 3],
          [2, 0, 0, 0, 0, 0, 0, 0, 0, 6],
          [0, 0, 0, 0, 0, 0, 0, 5, 0, 0],
          [0, 0, 5, 0, 0, 0, 0, 0, 0, 1],
          [0, 0, 0, 0, 8, 0, 0, 0, 2, 0],
          [0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
        ];
        break;
      case 12: // Pre-defined 12×12 puzzle (using 3×4 subgrids)
        example = [
          [0, 5, 0, 0, 8, 0, 0, 3, 0, 0, 0, 9],
          [7, 0, 0, 0, 0, 0, 5, 0, 0, 1, 0, 0],
          [0, 0, 9, 0, 0, 4, 0, 0, 7, 0, 0, 0],
          [0, 0, 0, 6, 0, 0, 0, 8, 0, 0, 3, 0],
          [0, 0, 0, 0, 0, 9, 0, 0, 0, 7, 0, 0],
          [0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0],
          [0, 0, 7, 0, 0, 0, 4, 0, 0, 0, 0, 2],
          [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0],
          [2, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0],
          [0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 0, 0],
          [0, 0, 0, 8, 0, 0, 0, 0, 0, 4, 0, 0],
          [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        break;
      case 16: // Pre-defined 16×16 puzzle (using 4×4 subgrids)
        example = [
          [0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 3, 0, 0, 0, 0, 12, 0, 0, 0, 0, 5, 0, 0, 0],
          [0, 0, 0, 0, 7, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

          [0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0],

          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        break;
      default:
        // Randomized example for other grid sizes
        example = Array(currentSize)
          .fill()
          .map(() => Array(currentSize).fill(0));
        let numCellsToFill = Math.min(8, currentSize);
        let positions = [];
        for (let r = 0; r < currentSize; r++) {
          for (let c = 0; c < currentSize; c++) {
            positions.push({ r, c });
          }
        }
        positions.sort(() => Math.random() - 0.5);
        for (let i = 0; i < numCellsToFill; i++) {
          const { r, c } = positions[i];
          example[r][c] = Math.floor(Math.random() * currentSize) + 1;
        }
        break;
    }

    let delay = 0;
    const increment = 1000 / (currentSize * currentSize);
    for (let row = 0; row < currentSize; row++) {
      for (let col = 0; col < currentSize; col++) {
        const value = example[row][col];
        if (value !== 0) {
          setTimeout(() => {
            currentGrid[row][col] = value;
            // Use cached cell element here
            const cell = cellElements[row][col];
            const input = cell.querySelector("input");
            cell.classList.add("selected");
            input.value = value;
            input.classList.add("original");
            setTimeout(() => {
              cell.classList.remove("selected");
            }, 200);
          }, delay);
          delay += increment;
        }
      }
    }
    setTimeout(() => {
      validateAllCells();
      showStatus("Example puzzle loaded.", false);
    }, delay + 200);
  });
}

function importPuzzle() {
  const importText = document.getElementById("importText").value.trim();
  if (!importText) {
    showStatus("Please enter puzzle data to import.", true);
    return;
  }
  document.getElementById("importOptions").classList.add("hidden");

  const lines = importText.split("\n").filter((l) => l.trim() !== "");
  const importedGrid = [];
  for (const line of lines) {
    const tokens = line.split(/[\s.]+/).filter((t) => t !== "");
    const row = [];
    for (const token of tokens) {
      if (/^\d+$/.test(token)) {
        const val = parseInt(token, 10);
        if (val >= 1 && val <= currentSize) {
          row.push(val);
        } else {
          row.push(0);
        }
      } else {
        row.push(0);
      }
    }
    if (row.length > 0) importedGrid.push(row);
  }

  if (
    importedGrid.length !== currentSize ||
    importedGrid.some((r) => r.length !== currentSize)
  ) {
    if (
      importedGrid.length &&
      [4, 6, 8, 9, 10, 12, 16].includes(importedGrid.length) &&
      importedGrid.every((r) => r.length === importedGrid.length)
    ) {
      const newSize = importedGrid.length;
      const confirmChange = confirm(
        `Imported puzzle is ${newSize}×${newSize}. Change grid size?`
      );
      if (confirmChange) {
        currentSize = newSize;
        document.getElementById("gridSize").value = newSize;
        createGrid();
      } else {
        showStatus("Import canceled (size mismatch).", true);
        return;
      }
    } else {
      showStatus("Invalid puzzle dimensions for the current grid size.", true);
      return;
    }
  }

  // If clearGrid() accepts a callback, use it to ensure the grid is cleared first.
  clearGrid(() => {
    let delay = 0;
    const increment = 1000 / (currentSize * currentSize);
    for (let row = 0; row < currentSize; row++) {
      for (let col = 0; col < currentSize; col++) {
        const value = importedGrid[row][col];
        if (value !== 0) {
          setTimeout(() => {
            currentGrid[row][col] = value;
            // Use the cached cell reference
            const cell = cellElements[row][col];
            const input = cell.querySelector("input");
            cell.classList.add("selected");
            input.value = value;
            input.classList.add("original");
            setTimeout(() => {
              cell.classList.remove("selected");
            }, 200);
          }, delay);
          delay += increment;
        }
      }
    }
    setTimeout(() => {
      validateAllCells();
      showStatus("Puzzle imported successfully!", false);
    }, delay + 200);
  });
}

function clearGrid(callback) {
  currentGrid = Array(currentSize)
    .fill()
    .map(() => Array(currentSize).fill(0));
  // Use cached cells to clear values
  let cells = cellElements.flat(); // flatten the 2D array
  let delay = 0;
  const increment = 500 / cells.length;
  cells.forEach((cell) => {
    setTimeout(() => {
      const input = cell.querySelector("input");
      if (input) {
        input.value = "";
        input.classList.remove("original", "solution");
      }
      cell.classList.remove("invalid", "active", "highlighted", "selected");
    }, delay);
    delay += increment;
  });
  activeCell = null;
  setTimeout(() => {
    showStatus("Grid cleared!", false);
    if (callback) callback();
  }, delay);
}

function checkValidity() {
  showLoading(true, "Checking puzzle validity...");
  setTimeout(() => {
    document.querySelectorAll(".sudoku-cell").forEach((cell) => {
      cell.classList.remove("invalid");
    });

    let hasInvalid = false;
    for (let row = 0; row < currentSize; row++) {
      for (let col = 0; col < currentSize; col++) {
        if (currentGrid[row][col] !== 0) {
          const valid = validateCell(row, col, currentGrid[row][col]);
          if (!valid) hasInvalid = true;
        }
      }
    }
    showLoading(false);

    if (hasInvalid) {
      showStatus(
        "Das Rätsel enthält Konflikte! Rote Felder zeigen Duplikate.",
        true
      );
      document.querySelectorAll(".sudoku-cell.invalid").forEach((cell) => {
        cell.classList.add("shake");
        setTimeout(() => cell.classList.remove("shake"), 500);
      });
    } else {
      const emptyCells = countEmptyCells();
      if (emptyCells === 0) {
        showStatus("Gültiges Rätsel und vollständig ausgefüllt!", false);
        document.querySelector(".sudoku-grid").classList.add("success-wave");
        setTimeout(() => {
          document
            .querySelector(".sudoku-grid")
            .classList.remove("success-wave");
        }, 1500);
      } else {
        showStatus(
          `Bisher läuft alles gut. ${emptyCells} leere Felder verbleiben.`,
          false
        );
      }
    }
  }, 500);
}

function solvePuzzle() {
  document.querySelectorAll(".sudoku-cell").forEach((cell) => {
    cell.classList.remove("invalid");
  });
  let hasInvalid = false;
  for (let row = 0; row < currentSize; row++) {
    for (let col = 0; col < currentSize; col++) {
      if (currentGrid[row][col] !== 0) {
        const valid = validateCell(row, col, currentGrid[row][col]);
        if (!valid) hasInvalid = true;
      }
    }
  }
  if (hasInvalid) {
    showStatus("Kann nicht gelöst werden: Das Rätsel enthält Konflikte!", true);
    document.querySelectorAll(".sudoku-cell.invalid").forEach((cell) => {
      cell.classList.add("shake");
      setTimeout(() => cell.classList.remove("shake"), 500);
    });
    return;
  }

  showLoading(true, "Solving puzzle...");
  solveStartTime = Date.now();
  solutionInProgress = true;

  const originalGrid = JSON.parse(JSON.stringify(currentGrid));

  setTimeout(() => {
    try {
      const solved = solveSudoku(currentGrid);
      if (solved) {
        const timeTaken = ((Date.now() - solveStartTime) / 1000).toFixed(2);
        document.getElementById("solveTime").textContent = `${timeTaken}s`;

        const puzzleCount =
          parseInt(document.getElementById("puzzlesSolved").textContent) + 1;
        document.getElementById("puzzlesSolved").textContent = puzzleCount;

        animateSolution(originalGrid, currentGrid);
      } else {
        showLoading(false);
        solutionInProgress = false;
        showStatus("Für dieses Rätsel existiert keine Lösung!", true);
      }
    } catch (err) {
      console.error(err);
      showLoading(false);
      solutionInProgress = false;
      showStatus("Fehler beim Lösen. Bitte die Rätselgültigkeit prüfen.", true);
    }
  }, 1000);
}

function animateSolution(originalGrid, solutionGrid) {
  const cellsToFill = [];
  for (let row = 0; row < currentSize; row++) {
    for (let col = 0; col < currentSize; col++) {
      if (originalGrid[row][col] === 0 && solutionGrid[row][col] !== 0) {
        cellsToFill.push({ row, col, value: solutionGrid[row][col] });
      }
    }
  }
  if (cellsToFill.length === 0) {
    showLoading(false);
    solutionInProgress = false;
    showStatus("Bereits gelöst!", false);

    return;
  }

  // Slight random fill order for visual interest
  cellsToFill.sort(() => Math.random() - 0.5);

  let delay = 0;
  cellsToFill.forEach((cellData, idx) => {
    setTimeout(() => {
      const { row, col, value } = cellData;
      const cellElement = document.querySelector(
        `.sudoku-cell[data-row="${row}"][data-col="${col}"]`
      );
      const input = cellElement.querySelector("input");
      cellElement.classList.add("selected");
      input.value = value;
      input.classList.add("solution");

      const progress = Math.round(((idx + 1) / cellsToFill.length) * 100);
      document.getElementById(
        "loadingMessage"
      ).textContent = `Solving: ${progress}%`;

      setTimeout(() => {
        cellElement.classList.remove("selected");
        cellElement.classList.add("solved");
        setTimeout(() => {
          cellElement.classList.remove("solved");
        }, 1000);
      }, 200);

      if (idx === cellsToFill.length - 1) {
        setTimeout(() => {
          showLoading(false);
          solutionInProgress = false;
          showStatus("Rätsel erfolgreich gelöst!", false);

          document.querySelector(".sudoku-grid").classList.add("success-wave");
          setTimeout(() => {
            document
              .querySelector(".sudoku-grid")
              .classList.remove("success-wave");
          }, 1500);
        }, 500);
      }
    }, delay);
    delay += animationSpeed;
  });
}

function solveSudoku(grid) {
  const cell = findEmptyCell(grid);
  if (!cell) return true;
  const { row, col } = cell;
  for (let num = 1; num <= currentSize; num++) {
    if (isValidValue(grid, row, col, num)) {
      grid[row][col] = num;
      if (solveSudoku(grid)) return true;
      grid[row][col] = 0;
    }
  }
  return false;
}

function findEmptyCell(grid) {
  let bestCell = null;
  let minPoss = currentSize + 1;
  for (let row = 0; row < currentSize; row++) {
    for (let col = 0; col < currentSize; col++) {
      if (grid[row][col] === 0) {
        let count = 0;
        for (let n = 1; n <= currentSize; n++) {
          if (isValidValue(grid, row, col, n)) count++;
        }
        if (count < minPoss) {
          minPoss = count;
          bestCell = { row, col };
          if (count === 1) return bestCell;
        }
      }
    }
  }
  return bestCell;
}

function isValidValue(grid, row, col, num) {
  for (let c = 0; c < currentSize; c++) {
    if (grid[row][c] === num) return false;
  }
  for (let r = 0; r < currentSize; r++) {
    if (grid[r][col] === num) return false;
  }

  let subW, subH;
  if (currentSize === 4) subW = subH = 2;
  else if (currentSize === 6) {
    subW = 3;
    subH = 2;
  } else if (currentSize === 8) {
    subW = 4;
    subH = 2;
  } else if (currentSize === 9) subW = subH = 3;
  else if (currentSize === 10) {
    subW = 5;
    subH = 2;
  } else if (currentSize === 12) {
    subW = 4;
    subH = 3;
  } else if (currentSize === 16) {
    subW = subH = 4;
  }

  const boxRow = Math.floor(row / subH) * subH;
  const boxCol = Math.floor(col / subW) * subW;
  for (let r = boxRow; r < boxRow + subH; r++) {
    for (let c = boxCol; c < boxCol + subW; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function validateCell(row, col, num) {
  let isValid = true;
  // Validate row
  for (let c = 0; c < currentSize; c++) {
    if (c !== col && currentGrid[row][c] === num) {
      isValid = false;
      cellElements[row][c].classList.add("invalid");
    }
  }
  // Validate column
  for (let r = 0; r < currentSize; r++) {
    if (r !== row && currentGrid[r][col] === num) {
      isValid = false;
      cellElements[r][col].classList.add("invalid");
    }
  }
  // Validate subgrid
  let subW, subH;
  if (currentSize === 4) {
    subW = subH = 2;
  } else if (currentSize === 6) {
    subW = 3;
    subH = 2;
  } else if (currentSize === 8) {
    subW = 4;
    subH = 2;
  } else if (currentSize === 9) {
    subW = subH = 3;
  } else if (currentSize === 10) {
    subW = 5;
    subH = 2;
  } else if (currentSize === 12) {
    subW = 4;
    subH = 3;
  } else if (currentSize === 16) {
    subW = subH = 4;
  }
  const boxRow = Math.floor(row / subH) * subH;
  const boxCol = Math.floor(col / subW) * subW;
  for (let r = boxRow; r < boxRow + subH; r++) {
    for (let c = boxCol; c < boxCol + subW; c++) {
      if ((r !== row || c !== col) && currentGrid[r][c] === num) {
        isValid = false;
        cellElements[r][c].classList.add("invalid");
      }
    }
  }
  // Toggle the invalid class on the current cell
  cellElements[row][col].classList.toggle("invalid", !isValid);
  return isValid;
}

function validateAllCells() {
  document.querySelectorAll(".sudoku-cell").forEach((cell) => {
    cell.classList.remove("invalid");
  });
  for (let row = 0; row < currentSize; row++) {
    for (let col = 0; col < currentSize; col++) {
      if (currentGrid[row][col] !== 0) {
        validateCell(row, col, currentGrid[row][col]);
      }
    }
  }
}

function highlightRelatedCells(row, col) {
  resetCellHighlighting();
  // row
  for (let c = 0; c < currentSize; c++) {
    if (c !== col) {
      document
        .querySelector(`.sudoku-cell[data-row="${row}"][data-col="${c}"]`)
        ?.classList.add("highlighted");
    }
  }
  // col
  for (let r = 0; r < currentSize; r++) {
    if (r !== row) {
      document
        .querySelector(`.sudoku-cell[data-row="${r}"][data-col="${col}"]`)
        ?.classList.add("highlighted");
    }
  }
  // subgrid
  let subW, subH;
  if (currentSize === 4) subW = subH = 2;
  else if (currentSize === 6) {
    subW = 3;
    subH = 2;
  } else if (currentSize === 8) {
    subW = 4;
    subH = 2;
  } else if (currentSize === 9) subW = subH = 3;
  else if (currentSize === 10) {
    subW = 5;
    subH = 2;
  } else if (currentSize === 12) {
    subW = 4;
    subH = 3;
  } else if (currentSize === 16) {
    subW = subH = 4;
  }
  const boxRow = Math.floor(row / subH) * subH;
  const boxCol = Math.floor(col / subW) * subW;
  for (let rr = boxRow; rr < boxRow + subH; rr++) {
    for (let cc = boxCol; cc < boxCol + subW; cc++) {
      if (rr !== row || cc !== col) {
        document
          .querySelector(`.sudoku-cell[data-row="${rr}"][data-col="${cc}"]`)
          ?.classList.add("highlighted");
      }
    }
  }
}

function resetCellHighlighting() {
  document.querySelectorAll(".sudoku-cell.highlighted").forEach((cell) => {
    cell.classList.remove("highlighted");
  });
  if (activeCell) {
    activeCell.classList.remove("active");
  }
}

function countEmptyCells() {
  let count = 0;
  for (let row = 0; row < currentSize; row++) {
    for (let col = 0; col < currentSize; col++) {
      if (currentGrid[row][col] === 0) count++;
    }
  }
  return count;
}

function showLoading(show, message = "Solving puzzle...") {
  const loadingContainer = document.getElementById("loadingContainer");
  const loadingMessage = document.getElementById("loadingMessage");
  if (show) {
    loadingMessage.textContent = message;
    loadingContainer.classList.remove("hidden");
  } else {
    loadingContainer.classList.add("hidden");
  }
}

function showStatus(msg, isError) {
  const statusMessage = document.getElementById("statusMessage");
  if (!msg) {
    statusMessage.classList.add("hidden");
    return;
  }
  statusMessage.textContent = msg;
  statusMessage.className = "mt-4 text-center p-3 rounded-md";

  if (isError) {
    statusMessage.classList.add(
      "bg-red-100",
      "text-red-700",
      "dark:bg-red-900",
      "dark:text-red-200"
    );
    statusMessage.classList.add("shake");
    setTimeout(() => {
      statusMessage.classList.remove("shake");
    }, 500);
  } else {
    statusMessage.classList.add(
      "bg-green-100",
      "text-green-700",
      "dark:bg-green-900",
      "dark:text-green-200"
    );
    // auto-hide success
    setTimeout(() => {
      statusMessage.classList.add("hidden");
    }, 4000);
  }
  statusMessage.classList.remove("hidden");
}

// Resize event to adapt cell size
window.addEventListener("resize", function () {
  const container = document.getElementById("sudokuContainer");
  if (container && container.querySelector(".sudoku-grid")) {
    const grid = container.querySelector(".sudoku-grid");
    const cellSize = Math.min(
      Math.floor((window.innerWidth * 0.8) / currentSize),
      50
    );
    grid.style.gridTemplateColumns = `repeat(${currentSize}, ${cellSize}px)`;
    grid.style.gridTemplateRows = `repeat(${currentSize}, ${cellSize}px)`;
  }
});
document.getElementById("year").textContent = new Date().getFullYear();
