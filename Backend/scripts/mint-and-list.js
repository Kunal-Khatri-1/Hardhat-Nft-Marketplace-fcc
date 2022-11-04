// mint and immidiately list on marketplace
// run a node to run scripts

const { ethers } = require("hardhat")

async function mintAndList() {
    const nftmarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")

    console.log("Minting...")
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    // capturing the tokenId in Event
    const tokenId = mintTxReceipt.events[0].args.tokenId

    console.log("Approving marketplace for the NFT...")
    const approvalTx = await basicNft.approve(basicNft.address, tokenId)
    await approvalTx.wait(1)

    console.log("Listing NFT...")
    const listingTx = await nftmarketplace.listItem(
        basicNft.address,
        tokenId,
        ethers.utils.parseEther("1")
    )
    await listingTx.wait(1)

    console.log("NFT listed!!!")
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit()
    })
