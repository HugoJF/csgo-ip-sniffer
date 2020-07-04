import {main} from "./config";
import prompts from "prompts";

async function add() {
    const response = await prompts([{
        message: 'What is the IP of the new server?',
        type: 'text',
        name: 'address',
        validate: value => value.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/),
    }, {
        message: 'What is the description?',
        type: 'text',
        name: 'description',
    }]);

    main().addServer(response.address, response.description);
}

async function remove() {
    if (Object.entries(main().servers()).length === 0) {
        return;
    }
    const response = await prompts({
        message: 'Select server to be removed',
        type: 'select',
        name: 'address',
        choices: Object.entries(main().servers()).map(([addr, desc]) => ({
            title: addr,
            value: addr,
            description: desc,
        })),
    });

    main().removeServer(response.address);
}

export async function setup() {
    const actions = {add, remove};
    const returns = {run: true, quit: false};

    while (true) {
        const {action} = await prompts({
            type: 'select',
            name: 'action',
            choices: [
                {title: 'Run', value: 'run'},
                {title: 'Add IP', value: 'add'},
                {title: 'Remove IP', value: 'remove'},
                {title: 'Quit', value: 'quit'},
            ],
            message: 'What do you want to do?',
        });
        let ret = returns[action];
        let call = actions[action];

        if (ret !== undefined) {
            return ret;
        }

        if (call) {
            await call();
        }
    }
}
