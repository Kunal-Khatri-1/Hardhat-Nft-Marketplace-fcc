// instead of being our script => having a main function we are going to make this a utility that we will import to other scripts => no main function

const { network } = require("hardhat")

// this is how you stop in async function, directly using setTimeout will not work
function sleep(timeInMs) {
    return new Promise((resolve) => setTimeout(resolve, timeInMs))
}

// sleepAmount = sleep/gap between blocks
async function moveBlocks(amount, sleepAmount = 0) {
    console.log("Moving blocks...")
    for (let index = 0; index < amount; index++) {
        await network.provider.request({
            method: "evm_mine",
            params: [],
        })

        if (sleepAmount) {
            console.log(`Sleeping for ${sleepAmount}`)
            await sleep(sleepAmount)
        }
    }
}

module.exports = {
    moveBlocks,
    sleep,
}
