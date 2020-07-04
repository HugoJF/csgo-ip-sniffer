import termSize from "term-size";
import Table from "cli-table";
import chalk from "chalk";
import sparkly from "sparkly";
import truncate from "cli-truncate";
import {increment, rotate} from "./helpers";

const frames = ['-', '\\', '|', '/'];
const tick = '√';
const cross = '×';
const noName = '?';

export function renderTable(servers) {
    const {columns} = termSize();
    const checkColumns = 3;
    const playersColumns = 13;
    const sparkColumns = 13;
    const nameColumns = columns - checkColumns - playersColumns - sparkColumns - 6;

    const table = new Table({
        chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
        colWidths: [checkColumns, nameColumns, playersColumns, sparkColumns]
    });

    for (let server of servers) {
        let {querying, failed, frame, name, players, history, maxPlayers} = server;

        let highlight = (text) => querying ? chalk.blue(text) : (failed ? chalk.red(text) : text);
        let status = querying ? frames[frame] : failed ? cross : tick;
        let spark = sparkly(history, {
            minimum: 0,
            maximum: Math.max(...history, maxPlayers)
        });

        server.frame = rotate(increment(frame), 0, frames.length - 1);
        players = `${players || 0} players`;
        name = truncate(name || noName, nameColumns - 2);

        let info = [
            chalk.green(status),
            name,
            players,
            spark,
        ];

        table.push(info.map(highlight));
    }

    let total = Object.values(servers).reduce((acc, {players}) => acc + (players || 0), 0);

    table.push(['', '', '', '']);
    table.push(['', 'TOTAL', `${total} players`, '']);

    return table.toString();
}