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