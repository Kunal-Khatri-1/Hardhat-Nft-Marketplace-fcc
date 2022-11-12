import { useEffect, useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import nftAbi from "../constants/BasicNft.json"
// using NextJs Image tags using moralis => can't deploy it statically to IPFS
import Image from "next/image"
import { Card, useNotification } from "web3uikit"
import { ethers } from "ethers"
import UpdateListingModal from "./UpdateListingModal"
import { Eth } from "@web3uikit/icons"

// this function is not dependent on anything inside of you app
// it is just a raw function => defining it outside export default
const truncateStr = (fullStr, strLen) => {
    if (fullStr.length <= strLen) return fullStr

    const separator = "..."
    let separatorLength = separator.length
    const charsToShow = strLen - separatorLength
    const frontChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)

    return (
        fullStr.substring(0, frontChars) +
        separator +
        fullStr.substring(fullStr.length - backChars)
    )
}

export default function NFTBox({ price, nftAddress, tokenId, marketplaceAddress, seller }) {
    console.log(
        `price: ${price}, nftAddress: ${nftAddress}, tokenId: ${tokenId}, marketplaceAddress ${marketplaceAddress}, seller: ${seller}`
    )
    const { isWeb3Enabled, account } = useMoralis()
    const [imageURI, setImageURI] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDescription, setTokenDescription] = useState("")
    const [showModal, setShowModal] = useState(false)
    const hideModal = () => setShowModal(false)
    const dispatch = useNotification()

    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId,
        },
    })

    const { runContractFunction: buyItem } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "buyItem",
        msgValue: price,
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
        },
    })

    async function updateUI() {
        // get the tokenURI
        // using the image tag from the tokenURI, get the image
        const tokenURI = await getTokenURI()
        console.log(`TokenURI: ${tokenURI}`)
        if (tokenURI) {
            // Not every browser is IPFS compatible therefore using IPFS Gateways
            // IPFS Gateway = A server that will return IPFS files from a "normal" URL
            const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            const tokenURIResponse = await (await fetch(requestURL)).json()
            const imageURI = tokenURIResponse.image
            const imageURIURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            setImageURI(imageURIURL)
            setTokenName(tokenURIResponse.name)
            setTokenDescription(tokenURI.description)
            // Other better methods
            //  1. we could render the image on our server, and just call our server
            //  2. For testnets and mainnets -> use moralis server hooks
            //  3. Have the world adopt IPFS
        }
    }

    // make sure updateUI is called
    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const isOwnedByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedByUser ? "You" : truncateStr(seller || "", 15)
    const handleCardClick = () => {
        // isOwnedByUser ? show the modal : buyItems
        console.log("Card clicked")
        isOwnedByUser
            ? setShowModal(true)
            : buyItem({
                  onError: (error) => console.log(error),
                  onSuccess: handleBuyItemSuccess,
              })

        console.log(`ShowModal: ${showModal}`)
    }

    const handleBuyItemSuccess = async (tx) => {
        await tx.wait(1)

        dispatch({
            type: "success",
            message: "NFT Bought",
            title: "Item Bought",
            position: "topR",
        })
    }

    function getPrice() {
        const fullPrice = ethers.utils.formatUnits(price, "ether")
        const indexOfDecimal = fullPrice.indexOf(".")
        const leadingSubstring = fullPrice.substring(0, indexOfDecimal)
        const trailingSubstring = fullPrice.substring(indexOfDecimal, indexOfDecimal + 5)
        let returnString = leadingSubstring + trailingSubstring
        if (fullPrice.length > 6) {
            returnString = returnString + "..."
        }
        return returnString
    }

    return (
        <div>
            {imageURI ? (
                <div>
                    <UpdateListingModal
                        isVisible={showModal}
                        price={price}
                        seller={seller}
                        tokenId={tokenId}
                        marketplaceAddress={marketplaceAddress}
                        nftAddress={nftAddress}
                        onClose={hideModal}
                    />

                    <Card
                        title={tokenName}
                        description={tokenDescription}
                        onClick={handleCardClick}
                    >
                        <div className="p-2">
                            <div className="flex flex-col items-end gap-2">
                                <div>#{tokenId}</div>
                                <div className="italic text-sm">
                                    Owned by {formattedSellerAddress}
                                </div>
                                <Image
                                    className=" self-center w-full"
                                    loader={() => imageURI}
                                    src={imageURI}
                                    width="200"
                                    height="200"
                                />
                                <div className="font-bold flex flex-row">
                                    <Eth fontSize="20px" />
                                    {getPrice()}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div>Loading...</div>
            )}
        </div>
    )
}
