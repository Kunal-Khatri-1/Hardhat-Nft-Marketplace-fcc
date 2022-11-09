// deploy process that will automatically update our front end so that we can grab the network address from a file that is programmatically created

const { ethers, network } = require("hardhat")
const fs = require("fs")

const frontEndContractsFile = "../Frontend/moraliss/constants/networkMapping.json"
const frontEndAbiLocation = "../Frontend/moraliss/constants/"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("updating front end...")
        await updateContractAddress()
        await updateAbi()
    }
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    // generate the file for us
    fs.writeFileSync(
        `${frontEndAbiLocation}NftMarketplace.json`,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )

    const basicNft = await ethers.getContract("BasicNft")
    fs.writeFileSync(
        `${frontEndAbiLocation}BasicNft.json`,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddress() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const chainId = network.config.chainId.toString()

    // reading network mapping file to see what's in there
    const contractAddress = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf-8"))
    if (chainId in contractAddress) {
        if (!contractAddress[chainId]["NftMarketplace"].includes(nftMarketplace.address)) {
            contractAddress[chainId]["NftMarketplace"].push(nftMarketplace.address)
        }
    } else {
        contractAddress[chainId] = { NftMarketplace: [nftMarketplace.address] }
    }

    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddress))
}

module.exports.tags = ["all", "frontend"]
