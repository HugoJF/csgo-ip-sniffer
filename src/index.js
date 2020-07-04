import logUpdate from 'log-update';
import axios from 'axios';
import {setup} from "./setup";
import {renderTable} from "./renderer";
import {main} from "./config";
import {sleep} from "./helpers";
import Server from "./server";

let ips = {};

function startTimers() {
    setInterval(render, 100);
    setInterval(queryServers, 1000);
}

function render() {
    let tables = [];

    for (let [, list] of Object.entries(ips)) {
        tables.push(renderTable(list))
    }

    logUpdate(tables.join('\n'));
}

async function queryServers() {
    for (let [, svs] of Object.entries(ips)) {
        let oldest = svs.map(sv => [sv, sv.age()])
            .sort((a, b) => b[1] - a[1]);

        oldest[0][0].query();
    }
}

async function start() {
    for (let [ip] of Object.entries(main().servers())) {
        console.log(`Fetching servers for IP ${ip}`);

        let response = await axios.get(`http://api.steampowered.com/ISteamApps/GetServersAtAddress/v0001?addr=${ip}`);

        ips[ip] = response.data.response.servers
            .map(server => (server.addr))
            .map(address => address.split(':'))
            .map(([host, port]) => new Server(host, port));

        ips[ip].forEach(server => server.query());

        await sleep(1000);
    }

    startTimers();
}

async function run() {
    if (await setup(run)) {
        await start()
    }
}

run();