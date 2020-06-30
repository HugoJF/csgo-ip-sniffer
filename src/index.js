import logUpdate from 'log-update';
import request from 'request';
import math from 'mathjs';
import Gamedig from 'gamedig';
import chalk from 'chalk';
import sparkly from "sparkly";
import Table from 'cli-table';
import termSize from "term-size";

const historySize = 10;

let queryServersTimer = undefined;
let servers = [];

const frames = ['-', '\\', '|', '/'];
const tick = '√';

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

    if (body.response.success !== true) {
        console.log('Error while requesting API information');
        return;
    }

    let svs = body.response.servers;

    svs = svs.map((server) => (server.addr));

    svs.forEach((server) => {
        servers[server] = {
            history: Array(historySize).fill(0),
        };
    });

    startTimer();
};

function startTimer() {
    setInterval(render, 100);
    setInterval(queryServers, 1000);
}

function fetchSessionForIp(ip, callback) {
    request.get('http://api.steampowered.com/ISteamApps/GetServersAtAddress/v0001?addr=' + ip, options, callback);
}

function splitAddress(address) {
    return address.split(':');
}

function clamp(value, min, max) {
    return math.max(math.min(max, value), min);
}

function rotate(value, min, max) {
    if (value > max) return min;

    return value;
}

function increase(value) {
    return value === undefined ? 0 : value + 1;
}

function render() {
    const {rows, columns} = termSize();
    const checkColumns = 3;
    const playersColumns = 13;
    const sparkColumns = 13;
    const nameColumns = columns - checkColumns - playersColumns - sparkColumns - 6;

    const table = new Table({
        chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
        colWidths: [checkColumns, nameColumns, playersColumns, sparkColumns]
    });

    Object.keys(servers).forEach((addr) => {
        let server = servers[addr];
        let high = (text) => server.querying ? chalk.blue(text) : (server.failed ? chalk.red(text) : text);

        server.frame = rotate(increase(server.frame), 0, frames.length - 1);

        let status = server.querying ? frames[server.frame] : server.failed ? '×' : tick;
        let name = server.name || '?';
        let players = `${server.players || '0'} players`;
        let history = sparkly(server.history, {minimum: 0, maximum: server.maxPlayers});

        if (name.length > nameColumns - 2) {
            name = name.slice(0, nameColumns - 3) + '…';
        }

        let info = [
            chalk.green(status),
            name,
            players,
            history,
        ];

        table.push(info.map((text) => high(text)));
    });

    let total = Object.values(servers).reduce((acc, server) => server.players ? acc + server.players : acc, 0);

    table.push(['', '', '', '']);
    table.push(['', 'TOTAL', `${total} players`, '']);

    logUpdate(table.toString());
}

function queryServers() {
    let now = (new Date()).getTime();

    let oldest = Object.keys(servers).map((server) => {
        let s = servers[server];

        s.addr = server;
        s.age = s.lastUpdated === undefined ? now : now - s.lastUpdated;

        return s;
    }).sort((a, b) => b.age - a.age);

    oldest = oldest[0].addr;

    let parts = splitAddress(oldest);
    let server = servers[oldest];

    server.lastUpdated = now;
    server.querying = true;

    Gamedig.query({
        type: 'csgo',
        host: parts[0],
        port: parts[1],
        socketTimeout: 1000,
    }).then((state) => {
        let players = state.players.length;
        let maxPlayers = state.maxplayers;

        let history = server.history;

        history.push(players);
        if (history.length > historySize) history.shift();
        server.name = state.name;
        server.players = players;
        server.maxPlayers = maxPlayers;
        server.querying = false;
        server.failed = false;

    }).catch(() => {
        server.querying = false;
        server.failed = true;
    });
}

fetchSessionForIp('177.54.150.15', processServersInIp);