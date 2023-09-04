function Debuggy (label) {

    return () => {
        console.log(label)
        console.log(...arguments)
    }
}

module.exports = Debuggy
