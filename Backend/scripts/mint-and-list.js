// mint and immidiately list on marketplace
// run a node to run scripts

const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function mintAndList() {
    const nftmarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    console.log(`NftMarketplace: ${nftmarketplace.address}`)
    console.log(`BasicNft ${basicNft.address}`)

    console.log("Minting...")
    const mintTx = await basicNft.mintNft()
    console.log("mintNFt transaction sent...")

    console.log("waiting for transaction receipt...")
    const mintTxReceipt = await mintTx.wait(1)
    console.log("Received mintNft transaction receipt")

    // capturing the tokenId in Event
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log(`TokenId: ${tokenId}`)

    console.log("Approving marketplace for the NFT...")
    const approvalTx = await basicNft.approve(nftmarketplace.address, tokenId)
    await approvalTx.wait(1)

    console.log("Listing NFT...")
    const listingTx = await nftmarketplace.listItem(
        basicNft.address,
        tokenId,
        ethers.utils.parseEther("0.0001")
    )
    await listingTx.wait(1)

    console.log("NFT listed!!!")

    if (network.config.chainId == "31337") {
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit()
    })
