function CrosswordCell(letter) {
    this.char = letter;
    this.across = null;
    this.down = null;
}

function CrosswordCellNode(index) {
    this.index = index;
}

function WordElement(word, index) {
    this.word = word;
    this.index = index;
}

function Crossword(words_in) {
    var GRID_ROWS = 50;
    var GRID_COLS = 50;
    var char_index = {};
    var bad_words;

    this.getSquareGrid = function(max_tries) {
        var best_grid = null;
        var best_ratio = 0;
        for (var i = 0; i < max_tries; i++) {
            var a_grid = this.getGrid(1);
            if (a_grid == null) continue;
            var ratio = Math.min(a_grid.length, a_grid[0].length) * 1.0 / Math.max(a_grid.length, a_grid[0].length);
            if (ratio > best_ratio) {
                best_grid = a_grid;
                best_ratio = ratio;
            }

            if (best_ratio == 1) break;
        }
        return best_grid;
    }

    this.getGrid = function(max_tries) {
        for (var tries = 0; tries < max_tries; tries++) {
            clear();
            var start_dir = randomDirection();
            var r = Math.floor(grid.length / 2);
            var c = Math.floor(grid[0].length / 2);
            var word_element = word_elements[0];
            if (start_dir == "across") {
                c -= Math.floor(word_element.word.length / 2);
            } else {
                r -= Math.floor(word_element.word.length / 2);
            }

            if (canPlaceWordAt(word_element.word, r, c, start_dir) !== false) {
                placeWordAt(word_element.word, word_element.index, r, c, start_dir);
            } else {
                bad_words = [word_element];
                return null;
            }

            var groups = [];
            groups.push(word_elements.slice(1));
            for (var g = 0; g < groups.length; g++) {
                word_has_been_added_to_grid = false;
                // try to add all the words in this group to the grid
                for (var i = 0; i < groups[g].length; i++) {
                    var word_element = groups[g][i];
                    var best_position = findPositionForWord(word_element.word);
                    if (!best_position) {
                        if (groups.length - 1 == g) groups.push([]);
                        groups[g + 1].push(word_element);
                    } else {
                        var r = best_position["row"],
                            c = best_position["col"],
                            dir = best_position['direction'];
                        placeWordAt(word_element.word, word_element.index, r, c, dir);
                        word_has_been_added_to_grid = true;
                    }
                }
                if (!word_has_been_added_to_grid) break;
            }
            if (word_has_been_added_to_grid) return minimizeGrid();
        }

        bad_words = groups[groups.length - 1];
        return null;
    }

    this.getBadWords = function() {
        return bad_words;
    }

    var minimizeGrid = function() {
        var r_min = GRID_ROWS - 1,
            r_max = 0,
            c_min = GRID_COLS - 1,
            c_max = 0;
        for (var r = 0; r < GRID_ROWS; r++) {
            for (var c = 0; c < GRID_COLS; c++) {
                var cell = grid[r][c];
                if (cell != null) {
                    if (r < r_min) r_min = r;
                    if (r > r_max) r_max = r;
                    if (c < c_min) c_min = c;
                    if (c > c_max) c_max = c;
                }
            }
        }
        var rows = r_max - r_min + 1;
        var cols = c_max - c_min + 1;
        var new_grid = new Array(rows);
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                new_grid[r] = new Array(cols);
            }
        }

        for (var r = r_min, r2 = 0; r2 < rows; r++, r2++) {
            for (var c = c_min, c2 = 0; c2 < cols; c++, c2++) {
                new_grid[r2][c2] = grid[r][c];
            }
        }

        return new_grid;
    }

    var addCellToGrid = function(word, index_of_word_in_input_list, index_of_char, r, c, direction) {
        var char = word.charAt(index_of_char);
        if (grid[r][c] == null) {
            grid[r][c] = new CrosswordCell(char);

            if (!char_index[char]) char_index[char] = [];

            char_index[char].push({
                "row": r,
                "col": c
            });
        }

    }


    var placeWordAt = function(word, index_of_word_in_input_list, row, col, direction) {
        if (direction == "across") {
            for (var c = col, i = 0; c < col + word.length; c++, i++) {
                addCellToGrid(word, index_of_word_in_input_list, i, row, c, direction);
            }
        } else if (direction == "down") {
            for (var r = row, i = 0; r < row + word.length; r++, i++) {
                addCellToGrid(word, index_of_word_in_input_list, i, r, col, direction);
            }
        } else {
            throw "Invalid Direction";
        }
    }


    var canPlaceCharAt = function(char, row, col) {
        // no intersection
        if (grid[row][col] == null) return 0;
        // intersection!
        if (grid[row][col]['char'] == char) return 1;

        return false;
    }

    var canPlaceWordAt = function(word, row, col, direction) {
        // out of bounds
        if (row < 0 || row >= grid.length || col < 0 || col >= grid[row].length) return false;

        if (direction == "across") {
            // out of bounds (word too long)
            if (col + word.length > grid[row].length) return false;
            // can't have a word directly to the left
            if (col - 1 >= 0 && grid[row][col - 1] != null) return false;
            // can't have word directly to the right
            if (col + word.length < grid[row].length && grid[row][col + word.length] != null) return false;


            for (var r = row - 1, c = col, i = 0; r >= 0 && c < col + word.length; c++, i++) {
                var is_empty = grid[r][c] == null;
                var is_intersection = grid[row][c] != null && grid[row][c]['char'] == word.charAt(i);
                var can_place_here = is_empty || is_intersection;
                if (!can_place_here) return false;
            }

            for (var r = row + 1, c = col, i = 0; r < grid.length && c < col + word.length; c++, i++) {
                var is_empty = grid[r][c] == null;
                var is_intersection = grid[row][c] != null && grid[row][c]['char'] == word.charAt(i);
                var can_place_here = is_empty || is_intersection;
                if (!can_place_here) return false;
            }


            var intersections = 0;
            for (var c = col, i = 0; c < col + word.length; c++, i++) {
                var result = canPlaceCharAt(word.charAt(i), row, c);
                if (result === false) return false;
                intersections += result;
            }
        } else if (direction == "down") {
            if (row + word.length > grid.length) return false;
            if (row - 1 >= 0 && grid[row - 1][col] != null) return false;
            if (row + word.length < grid.length && grid[row + word.length][col] != null) return false;


            for (var c = col - 1, r = row, i = 0; c >= 0 && r < row + word.length; r++, i++) {
                var is_empty = grid[r][c] == null;
                var is_intersection = grid[r][col] != null && grid[r][col]['char'] == word.charAt(i);
                var can_place_here = is_empty || is_intersection;
                if (!can_place_here) return false;
            }

            for (var c = col + 1, r = row, i = 0; r < row + word.length && c < grid[r].length; r++, i++) {
                var is_empty = grid[r][c] == null;
                var is_intersection = grid[r][col] != null && grid[r][col]['char'] == word.charAt(i);
                var can_place_here = is_empty || is_intersection;
                if (!can_place_here) return false;
            }


            var intersections = 0;
            for (var r = row, i = 0; r < row + word.length; r++, i++) {
                var result = canPlaceCharAt(word.charAt(i, 1), r, col);
                if (result === false) return false;
                intersections += result;
            }
        } else {
            throw "Invalid Direction";
        }
        return intersections;
    }

    var randomDirection = function() {
        return Math.floor(Math.random() * 2) ? "across" : "down";
    }

    var findPositionForWord = function(word) {
        var bests = [];
        for (var i = 0; i < word.length; i++) {
            var possible_locations_on_grid = char_index[word.charAt(i)];
            if (!possible_locations_on_grid) continue;
            for (var j = 0; j < possible_locations_on_grid.length; j++) {
                var point = possible_locations_on_grid[j];
                var r = point['row'];
                var c = point['col'];
                var intersections_across = canPlaceWordAt(word, r, c - i, "across");
                var intersections_down = canPlaceWordAt(word, r - i, c, "down");

                if (intersections_across !== false)
                    bests.push({
                        "intersections": intersections_across,
                        "row": r,
                        "col": c - i,
                        "direction": "across"
                    });
                if (intersections_down !== false)
                    bests.push({
                        "intersections": intersections_down,
                        "row": r - i,
                        "col": c,
                        "direction": "down"
                    });
            }
        }

        if (bests.length == 0) return false;

        var best = bests[Math.floor(Math.random() * bests.length)];

        return best;
    }

    var clear = function() {
        for (var r = 0; r < grid.length; r++) {
            for (var c = 0; c < grid[r].length; c++) {
                grid[r][c] = null;
            }
        }
        char_index = {};
    }

    if (words_in.length < 2) throw "A crossword must have at least 2 words";

    var grid = new Array(GRID_ROWS);
    for (var i = 0; i < GRID_ROWS; i++) {
        grid[i] = new Array(GRID_COLS);
    }

    var word_elements = [];
    for (var i = 0; i < words_in.length; i++) {
        word_elements.push(new WordElement(words_in[i], i));
    }


    word_elements.sort(function(a, b) {
        return b.word.length - a.word.length;
    });
}

var CrosswordUtils = {
    PATH_TO_PNGS_OF_NUMBERS: "numbers/",

    toHtml: function(grid, show_answers) {
        if (grid == null) return;
        var html = [];
        html.push("<table class='crossword'>");
        var label = 1;
        for (var r = 0; r < grid.length; r++) {
            html.push("<tr>");
            for (var c = 0; c < grid[r].length; c++) {
                var cell = grid[r][c];
                if (cell == null) {
                    var char = "&nbsp;";
                } else {
                    var char = cell['char'];
                }

                html.push("<td class='" + "' title='" + r + ", " + c + "'>");

                if (show_answers) {
                    html.push(char);
                } else {
                    html.push("&nbsp;");
                }
            }
            html.push("</tr>");
        }
        html.push("</table>");
        return html.join("\n");
    }
}

function getWords() {
    var wordsList = document.getElementById('inputWords').value;
    wordsList = wordsList.split(",");
    return wordsList;
}

function createPuzzle() {

    var words = getWords();


    var cw = new Crossword(words);

    var tries = 10;
    var grid = cw.getSquareGrid(tries);

    if (grid == null) {
        var bad_words = cw.getBadWords();
        var str = [];
        for (var i = 0; i < bad_words.length; i++) {
            str.push(bad_words[i].word);
        }
        alert("Shoot! A grid could not be created with these words:\n" + str.join("\n"));
        return;
    }

    var show_answers = true;
    document.getElementById("crosswordresult").innerHTML = CrosswordUtils.toHtml(grid, show_answers);

};
