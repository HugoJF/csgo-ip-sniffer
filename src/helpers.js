export function humanTime(millis) {
    const units = [{
        unit: 'ms',
        amount: 1000,
    }, {
        unit: 's',
        amount: 60,
    }, {
        unit: 'm',
        amount: 60,
    }, {
        unit: 'h',
        amount: 24,
    }, {
        unit: 'day',
    }];

    let i = 0;
    while (units[i].amount && millis >= units[i].amount) {
        millis /= units[i++].amount;
    }

    return {
        duration: millis,
        unit: units[i].unit,
    }
}

export function rotate(value, min, max) {
    return (value > max) ? min : value;
}

export function increment(value) {
    return value === undefined ? 0 : value + 1;
}

export function sleep(duration) {
    return new Promise((res, rej) => {
        setTimeout(res, duration);
    })
}