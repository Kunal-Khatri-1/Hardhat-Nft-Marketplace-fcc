const { default: Moralis } = require("moralis/.")
const moralis = require("morlais/node")
require("dotenv").config()
const contractAddresses = require("./constants/networkMapping.json")
let chainId = process.env.chainId || "31337"
let moralisChainId = chainId == "31337" ? "1337" : chainId
// getting the most recently deployed NFT Marketplace contract
const contractAddress = contractAddresses[chainId]["NftMarketplace"][0]
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
const appId = process.env.NEXT_PUBLIC_APP_ID
const masterKey = process.env.masterKey

async function main() {
    await Moralis.start({ serverUrl, appId, masterKey })
    console.log(`Working with contract address ${contractAddress}`)

    let itemListedOptions = {
        // Moralis understands a local chain is 1337
        chainId: moralisChainId,
        // sync_historical allows the nodes to go back throughout the blockchain, grab all the events ever emitted by that contract
        sync_historal: true,
        topic: "ItemListed(address,address,uint256,uint256)",
        // abi for just the event, got from artifacts
        abi: {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: "address",
                    name: "seller",
                    type: "address",
                },
                {
                    indexed: true,
                    internalType: "address",
                    name: "nftAddress",
                    type: "address",
                },
                {
                    indexed: true,
                    internalType: "uint256",
                    name: "tokenId",
                    type: "uint256",
                },
                {
                    indexed: false,
                    internalType: "uint256",
                    name: "price",
                    type: "uint256",
                },
            ],
            name: "ItemListed",
            type: "event",
        },
        // thiw will create a new table named ItemListed filled with information about itemListed event
        tableName: "ItemListed",
    }

    let ItemBoughtOptions = {
        chainId: moralisChainId,
        sync_historal: true,
        topic: "ItemBought(address,address,uint256,uint256)",
        abi: {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: "address",
                    name: "buyer",
                    type: "address",
                },
                {
                    indexed: true,
                    internalType: "address",
                    name: "nftAddress",
                    type: "address",
                },
                {
                    indexed: true,
                    internalType: "uint256",
                    name: "tokenId",
                    type: "uint256",
                },
                {
                    indexed: false,
                    internalType: "uint256",
                    name: "price",
                    type: "uint256",
                },
            ],
            name: "ItemBought",
            type: "event",
        },
        tableName: "ItemBought",
    }

    let itemCanceledOptions = {
        chainId: chainId,
        sync_historal: true,
        topic: "ItemCanceled(address,address,uint256)",
        abi: {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: "address",
                    name: "seller",
                    type: "address",
                },
                {
                    indexed: true,
                    internalType: "address",
                    name: "nftAddress",
                    type: "address",
                },
                {
                    indexed: false,
                    internalType: "uint256",
                    name: "tokenId",
                    type: "uint256",
                },
            ],
            name: "ItemCanceled",
            type: "event",
        },
        tableName: "ItemCanceled",
    }

    // this API call we are making to our server is going to return a response == true

    const listedResponse = await Moralis.cloud.run("watchContractEvent", itemListedOptions, {
        useMasterKey: true,
    })

    const boughtResponse = await Moralis.cloud.run("watchContractEvent", itemBought, {
        useMasterKey: true,
    })

    const canceledResponse = await Moralis.cloud.run("watchContractEvent", itemCanceledOptions, {
        useMasterKey: true,
    })

    // making sure if everything is gone well
    if (listedResponse.success && canceledResponse.success && boughtResponse.success) {
        console.log("Success! Database updated with watching events")
    } else {
        console.log("Something went wrong...")
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
