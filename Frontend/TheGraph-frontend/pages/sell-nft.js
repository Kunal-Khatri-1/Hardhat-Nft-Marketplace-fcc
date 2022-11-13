import styles from "../styles/Home.module.css"
import { Button, Form, useNotification } from "web3uikit"
import { ethers } from "ethers"
import nftAbi from "../constants/BasicNft.json"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import networkMapping from "../constants/networkMapping.json"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { useEffect, useState } from "react"
import { Eth } from "@web3uikit/icons"

export default function Home() {
    // chainId comes in Hex form => convert it to normal string
    const { chainId, account, isWeb3Enabled } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    const marketplaceAddress = networkMapping[chainString].NftMarketplace[0]
    const dispatch = useNotification()
    const [proceeds, setProceeds] = useState("0")

    const { runContractFunction } = useWeb3Contract()

    async function approveAndList(data) {
        console.log("Approving...")
        const nftAddress = data.data[0].inputResult
        const tokenId = data.data[1].inputResult
        const price = ethers.utils.parseUnits(data.data[2].inputResult, "ether").toString()

        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: marketplaceAddress,
                tokenId: tokenId,
            },
        }

        await runContractFunction({
            params: approveOptions,
            onSuccess: (tx) => handleApproveSuccess(tx, nftAddress, tokenId, price),
            onError: (error) => {
                console.log(error)
            },
        })
    }

    async function handleApproveSuccess(tx, nftAddress, tokenId, price) {
        await tx.wait(1)
        console.log("Ok! Now time to List")

        const listOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: price,
            },
        }

        await runContractFunction({
            params: listOptions,
            onSuccess: handleListSuccess,
            onError: (error) => console.log(error),
        })
    }

    async function handleListSuccess(tx) {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "NFT Listed",
            title: "NFT Listed",
            position: "topR",
        })
    }

    const handleWithdrawSuccess = async (tx) => {
        tx.wait(1)
        dispatch({
            type: "success",
            message: "Withdrawing proceeds",
            position: "topR",
        })
    }

    function showProceeds() {
        const fullPrice = ethers.utils.formatUnits(proceeds, "ether")
        const indexOfDecimal = fullPrice.indexOf(".")
        const leadingSubstring = fullPrice.substring(0, indexOfDecimal)
        const trailingSubstring = fullPrice.substring(indexOfDecimal, indexOfDecimal + 6)
        let returnString = leadingSubstring + trailingSubstring
        if (fullPrice.length > 6) {
            returnString = returnString + "..."
        }
        return returnString
    }

    async function setupUI() {
        const returnedProceeds = await runContractFunction({
            params: {
                abi: nftMarketplaceAbi,
                contractAddress: marketplaceAddress,
                functionName: "getProceeds",
                params: {
                    seller: account,
                },
            },
            onError: (error) => console.log(error),
        })
        if (returnedProceeds) {
            setProceeds(returnedProceeds.toString())
        }
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            setupUI()
        }
    }, [proceeds, account, isWeb3Enabled, chainId])

    return (
        <div className={styles.container}>
            <div className="py-20">
                <div className="pt-4 w-10/12 m-auto max-w-xl border-2 rounded-md shadow-md">
                    <h1 className=" py-6 px-4 font-bold text-3xl text-center">Sell your NFT</h1>
                    <Form
                        buttonConfig={{
                            theme: "primary",
                        }}
                        // approve marketplace to pull the NFT from the wallet and then list it
                        // when form is submitted, it will automatically pass all the "data object" to approveAndList function
                        onSubmit={approveAndList}
                        data={[
                            {
                                name: "NFT Address",
                                type: "text",
                                value: "",
                                key: "nftAddress",
                                inputWidth: "100%",
                            },
                            {
                                name: "Token Id",
                                type: "number",
                                value: "",
                                key: "tokenId",
                                inputWidth: "100%",
                            },
                            {
                                name: "Price (in ETH)",
                                type: "number",
                                value: "",
                                key: "price",
                                inputWidth: "100%",
                            },
                        ]}
                        id="Main Form"
                    />

                    <div className="border-t-2 py-4 mt-4 pl-5 font-bold text-lg flex flex-row justify-between">
                        <div className="flex flex-row items-center">
                            Your Balance: &nbsp; <Eth fontSize="20px" /> {showProceeds()}
                        </div>
                        <div className="pr-5">
                            <Button
                                onClick={() => {
                                    runContractFunction({
                                        params: {
                                            abi: nftMarketplaceAbi,
                                            contractAddress: marketplaceAddress,
                                            functionName: "withdrawProceeds",
                                            params: {},
                                        },
                                        onError: (error) => console.log(error),
                                        onSuccess: handleWithdrawSuccess,
                                    })
                                }}
                                text="Withdraw"
                                type="button"
                                theme="secondary"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
