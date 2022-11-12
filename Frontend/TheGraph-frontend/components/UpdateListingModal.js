import { useState } from "react"
import { useWeb3Contract } from "react-moralis"
import { Modal, Input, useNotification } from "web3uikit"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import { ethers } from "ethers"
import NFTBox from "./NFTBox"

export default function UpdateListingModal({
    nftAddress,
    price,
    tokenId,
    seller,
    isVisible,
    marketplaceAddress,
    onClose,
}) {
    const dispatch = useNotification()

    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0)

    const handleUpdateListingSuccess = async (tx) => {
        await tx.wait(1)

        dispatch({
            type: "success",
            message: "Listing updated",
            title: "Listing updated - please refresh (and move Blocks)",
            position: "topR",
        })
        onClose && onClose()
        setPriceToUpdateListingWith("0")
    }

    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "updateListing",
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
            // should'nt we do priceToUpdateLisingWith.toString()
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0"),
        },
    })

    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={() => {
                // onSuccess automatically passes the result of the call (updateListing) to the callback function is there (handleUpdateListingSuccess)
                // updateListing returns a txn and that txn automatically get passed to the onSuccess (handleUpdateListingSuccess)
                updateListing({
                    onError: (error) => {
                        console.log(error)
                    },
                    onSuccess: handleUpdateListingSuccess,
                })
            }}
            title="Update Listing"
            width="500px"
        >
            <div className="flex flex-row justify-center items-center">
                <div className=" w-40">
                    <NFTBox
                        price={price}
                        nftAddress={nftAddress}
                        tokenId={tokenId}
                        marketplaceAddress={marketplaceAddress}
                        seller={seller}
                        key={`${nftAddress}${tokenId}`}
                    />
                </div>
            </div>

            <div className="my-8 flex flex-row justify-center items-center">
                <Input
                    label="Update listing price in L1 Currency (ETH)"
                    name="New listing price"
                    type="number"
                    onChange={(event) => {
                        setPriceToUpdateListingWith(event.target.value)
                    }}
                ></Input>
            </div>
        </Modal>
    )
}
