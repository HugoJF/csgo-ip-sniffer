import Gamedig from "gamedig";

export default class Server {
    constructor(host, port) {
        this.host = host;
        this.port = port;

        this.historySize = 11;

        this.name = '?';
        this.players = 0;
        this.maxPlayers = 0;
        this.history = Array(this.historySize).fill(0);
        this.lastUpdated = null;
        this.lastQueried = null;
        this.querying = null;
    }

    age() {
        return Date.now() - (this.lastUpdated || 0);
    }

    async lock(callback) {
        try {
            this.querying = true;
            this.lastUpdated = Date.now();
            await callback();
            this.failed = false;
            this.querying = false;
            this.lastQueried = Date.now();
        } catch (e) {
            this.querying = false;
            this.failed = true;
        }
    }

    async query() {
        this.lock(async () => {
            let state = await Gamedig.query({
                type: 'csgo',
                host: this.host,
                port: this.port,
                socketTimeout: 1000,
            });

            let players = state.players.length;
            let maxPlayers = state.maxplayers;

            this.history.push(players);
            if (this.history.length > this.historySize) {
                this.history.shift();
            }

            this.name = state.name;
            this.players = players;
            this.maxPlayers = maxPlayers;
        })
    }
}