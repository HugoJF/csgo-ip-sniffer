import termSize from "term-size";
import Table from "cli-table";
import chalk from "chalk";
import sparkly from "sparkly";
import truncate from "cli-truncate";
import {humanTime, increment, rotate} from "./helpers";

const QUERY = 'query';
const ONLINE = 'online';
const OFFLINE = 'offline';

const frames = ['-', '\\', '|', '/'];
const tick = '√';
const cross = '×';
const noName = '?';

const highlights = {
    [QUERY]: chalk.blue,
    [ONLINE]: chalk.white,
    [OFFLINE]: chalk.red,
};

const playerWord = [
    'player',
    'players',
];

const checkColumns = 3;
const playersColumns = 13;
const sparkColumns = 13;

export function renderTable(servers) {
    const {columns} = termSize();
    let nameColumns = columns - (checkColumns + 2) - (playersColumns + 2) - (sparkColumns + 2);

    const table = new Table({
        chars: {
            'mid': '',
            'left-mid': '',
            'mid-mid': '',
            'right-mid': ''
        },
        style: {
            border: ['gray'],
        },
        colWidths: [checkColumns, nameColumns, playersColumns, sparkColumns]
    });

    for (let server of servers) {
        let {querying, failed, frame, name, players, history, maxPlayers} = server;
        let state = querying ? QUERY : (failed ? OFFLINE : ONLINE);

        let statusChars = {
            [QUERY]: frames[frame],
            [ONLINE]: tick,
            [OFFLINE]: cross,
        };

        let spark = sparkly(history, {
            minimum: 0,
            maximum: Math.max(...history, maxPlayers)
        });

        let highlight = highlights[state];
        let status = statusChars[state];
        let word = playerWord[+(players !== 1)];
        let delta = 0;
        let duration = null;
        if (server.lastQueried) {
            delta = Date.now() - server.lastQueried;
            duration = humanTime(delta);
        }

        players = players || 0;
        server.frame = rotate(increment(frame), 0, frames.length - 1);
        players = [players, word].join(' ');
        name = truncate(name || noName, nameColumns - 2);

        let info = [
            chalk.green(status),
            name,
            players,
            failed && duration ? (Math.round(duration.duration) + duration.unit + ' offline') : spark,
        ];

        table.push(info.map(i => highlight(i)));
    }

    let total = Object.values(servers).reduce((acc, {players}) => acc + (players || 0), 0);

    table.push(['', '', '', '']);
    table.push(['', 'TOTAL', `${total} players`, '']);

    return table.toString();
}