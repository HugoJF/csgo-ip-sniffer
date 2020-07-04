import fs from 'fs';

const {readFile, writeFile, stat} = fs.promises;

export default class Config {
    constructor(location = 'servers.json') {
        this.location = location;
        this.config = {
            servers: {},
        };

        this.boot()
    }

    async boot() {
        try {
            await stat(this.location);
            await this.load();
        } catch (e) {
            await writeFile(this.location, JSON.stringify(this.config));
        }
    }

    async load() {
        let raw = await readFile(this.location);

        this.config = JSON.parse(raw);

        if (!this.config.servers) {
            this.config.servers = [];
        }
    }

    async save() {
        let raw = JSON.stringify(this.config);

        await writeFile(this.location, raw);
    }

    servers() {
        return this.config.servers;
    }

    addServer(address, description) {
        this.config.servers[address] = description;

        this.save();
    }

    removeServer(address) {
        delete this.config.servers[address];

        this.save();
    }
}

let _main = new Config();

export const main = () => _main;