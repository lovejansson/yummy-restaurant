export const Debugger = (isProd) => (...args) => {
    if (!isProd) {
        console.debug(...args);
    }
}
