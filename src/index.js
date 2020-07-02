import logUpdate from 'log-update';
import request from 'request';
import math from 'mathjs';
import Gamedig from 'gamedig';
import chalk from 'chalk';
import sparkly from "sparkly";
import Table from 'cli-table';
import termSize from "term-size";


let servers = [];

const frames = ['-', '\\', '|', '/'];
const tick = '√';
const cross = '×';
const noName = '?';
const ellipsis = '…';
const historySize = 10;

const options = {
    json: true,
    timeout: 10000,
};

const processServersInIp = (err, res, body) => {
    if (err) {
        console.log('Error while fetching session information');
        return;
    }

    if (!body) {
        console.log('Empty response body');
        return;
    }

    if (!body.response) {
        console.log('Invalid response');
        return;
    }

    if (body.response.success === false) {
        console.log('Error while requesting API information');
        return;
    }

    body.response.servers
        .map((server) => (server.addr))
        .forEach((addr) => {
            servers[addr] = {
                history: Array(historySize).fill(0),
            };
            updateServer(addr);
        });

    startTimers();
};

function startTimers() {
    setInterval(render, 100);
    setInterval(queryServers, 1000);
}

function fetchSessionForIp(ip, callback) {
    request.get(`http://api.steampowered.com/ISteamApps/GetServersAtAddress/v0001?addr=${ip}`, options, callback);
}

function splitAddress(address) {
    return address.split(':');
}

function rotate(value, min, max) {
    return (value > max) ? min : value;
}

function increment(value) {
    return value === undefined ? 0 : value + 1;
}

function render() {
    const {columns} = termSize();
    const checkColumns = 3;
    const playersColumns = 13;
    const sparkColumns = 13;
    const nameColumns = columns - checkColumns - playersColumns - sparkColumns - 6;

    const table = new Table({
        chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
        colWidths: [checkColumns, nameColumns, playersColumns, sparkColumns]
    });

    for (let server of Object.values(servers)) {
        let {querying, failed, frame, name, players, history, maxPlayers} = server;

        let highlight = (text) => querying ? chalk.blue(text) : (failed ? chalk.red(text) : text);
        let status = querying ? frames[frame] : failed ? cross : tick;
        let spark = sparkly(history, {minimum: 0, maximum: maxPlayers});

        server.frame = rotate(increment(frame), 0, frames.length - 1);
        players = `${players || '0'} players`;

        name = name || noName;
        if (name.length > nameColumns - 2) {
            name = name.slice(0, nameColumns - 3) + ellipsis;
        }

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

    logUpdate(table.toString());
}

async function updateServer(addr) {
    let server = servers[addr];
    let now = (new Date).getTime();
    let [host, port] = splitAddress(addr);

    try {

        server.lastUpdated = now;
        server.querying = true;

        let state = await Gamedig.query({
            type: 'csgo',
            host: host,
            port: port,
            socketTimeout: 1000,
        });

        let players = state.players.length;
        let maxPlayers = state.maxplayers;
        let history = server.history;

        history.push(players);
        if (history.length > historySize) {
            history.shift();
        }

        server.name = state.name;
        server.players = players;
        server.maxPlayers = maxPlayers;
        server.querying = false;
        server.failed = false;
    } catch (e) {
        server.querying = false;
        server.failed = true;
    }
}

async function queryServers() {
    let now = (new Date).getTime();

    let oldest = Object.keys(servers).map((addr) => {
        const server = servers[addr];

        return {
            addr: addr,
            age: now - (server.lastUpdated || 0),
        };
    }).sort((a, b) => b.age - a.age);

    oldest = oldest[0].addr;

    updateServer(oldest)
}

fetchSessionForIp('177.54.150.15', processServersInIp);