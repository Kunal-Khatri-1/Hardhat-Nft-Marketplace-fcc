// mint and immidiately list on marketplace

const { ethers } = require("hardhat")

async function mintAndList() {
    const nftmarketplace = await ethers.getContract("nftMarketPlace")
    const basicNft = await ethers.getContract("BasicNft")

    console.log("Minting...")
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit()
    })
