const X = 1; // wall
const _ = 0; // passageway w/food
const n = -1; // no food
const P = -2; // pellet

// Numbers > 1 indicate teleports, paired by value

const levelGrid = [
    [_, _, _, _, _, _, _, _, _, _, _, _, X, X, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, X, X, X, X, _, X, X, X, X, X, _, X, X, _, X, X, X, X, X, _, X, X, X, X, _],
    [P, X, X, X, X, _, X, X, X, X, X, _, X, X, _, X, X, X, X, X, _, X, X, X, X, P],
    [_, X, X, X, X, _, X, X, X, X, X, _, X, X, _, X, X, X, X, X, _, X, X, X, X, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, X, X, X, X, _, X, X, _, X, X, X, X, X, X, X, X, _, X, X, _, X, X, X, X, _],
    [_, X, X, X, X, _, X, X, _, X, X, X, X, X, X, X, X, _, X, X, _, X, X, X, X, _],
    [_, _, _, _, _, _, X, X, _, _, _, _, X, X, _, _, _, _, X, X, _, _, _, _, _, _],
    [X, X, X, X, X, _, X, X, X, X, X, n, X, X, n, X, X, X, X, X, _, X, X, X, X, X],
    [X, X, X, X, X, _, X, X, X, X, X, n, X, X, n, X, X, X, X, X, _, X, X, X, X, X],
    [X, X, X, X, X, _, X, X, n, n, n, n, n, n, n, n, n, n, X, X, _, X, X, X, X, X],
    [X, X, X, X, X, _, X, X, n, X, X, X, X, X, X, X, X, n, X, X, _, X, X, X, X, X],
    [X, X, X, X, X, _, X, X, n, X, X, X, X, X, X, X, X, n, X, X, _, X, X, X, X, X],
    [2, n, n, n, n, _, n, n, n, X, X, X, X, X, X, X, X, n, n, n, _, n, n, n, n, 2],
    [X, X, X, X, X, _, X, X, n, X, X, X, X, X, X, X, X, n, X, X, _, X, X, X, X, X],
    [X, X, X, X, X, _, X, X, n, X, X, X, X, X, X, X, X, n, X, X, _, X, X, X, X, X],
    [X, X, X, X, X, _, X, X, n, n, n, n, n, n, n, n, n, n, X, X, _, X, X, X, X, X],
    [X, X, X, X, X, _, X, X, n, X, X, X, X, X, X, X, X, n, X, X, _, X, X, X, X, X],
    [X, X, X, X, X, _, X, X, n, X, X, X, X, X, X, X, X, n, X, X, _, X, X, X, X, X],
    [_, _, _, _, _, _, _, _, _, _, _, _, X, X, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, X, X, X, X, _, X, X, X, X, X, _, X, X, _, X, X, X, X, X, _, X, X, X, X, _],
    [_, X, X, X, X, _, X, X, X, X, X, _, X, X, _, X, X, X, X, X, _, X, X, X, X, _],
    [P, _, _, X, X, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, X, X, _, _, P],
    [X, X, _, X, X, _, X, X, _, X, X, X, X, X, X, X, X, _, X, X, _, X, X, _, X, X],
    [X, X, _, X, X, _, X, X, _, X, X, X, X, X, X, X, X, _, X, X, _, X, X, _, X, X],
    [_, _, _, _, _, _, X, X, _, _, _, _, X, X, _, _, _, _, X, X, _, _, _, _, _, _],
    [_, X, X, X, X, X, X, X, X, X, X, _, X, X, _, X, X, X, X, X, X, X, X, X, X, _],
    [_, X, X, X, X, X, X, X, X, X, X, _, X, X, _, X, X, X, X, X, X, X, X, X, X, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

export default levelGrid;