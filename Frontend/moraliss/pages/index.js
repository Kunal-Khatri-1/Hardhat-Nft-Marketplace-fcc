import Image from "next/image"
import styles from "../styles/Home.module.css"
// automatically run th query the instant our index pops up
// get all the active items from database
import { useMoralis } from "react-moralis"
import NFTBox from "../components/NFTBox"

// WE DON'T WANT TO MUCH CHANGE OUR PROTOCOL FOR JUST THE WEBSITE
// CAN'T USE ARRAY FOR LISTING => NOT SCALABLE FOR COMPLEX QUERRIES AND MORE GAS EXPENSIVE
// EVENTS COMES TO THE RESCUE (SMART CONTRACTS CAN'T ACCESS EVENTS DATA BUT OFF-CHAIN FRONTEND CAN)
// WE WILL INDEX THE EVENTS OFF-CHAIN AND THEN READ FROM OUR DATABASE
// SETUP A SERVER TO LISTEN FOR THOSE EVENTS TO BE FIRED, AND WE WILL ADD THEM TO A DATABASE TO QUERY
// TWO APPROACHES
// 1. MORALIS => CENTRALIZED => COMES WITH SPEED AND LOCAL DEVELOPMENT
// 2. THE GRAPH => DECENTRALIZED
// EITHER CASE OUR SMART CONTRACTS / LOGIC IS DECENTRALIZED

export default function Home() {
    const { isWeb3Enabled } = useMoralis()
    // useMoralis(<TableName>, <function for the query>)
    // the result of the function in useMoralis will be saved in the listedNfts
    const { data: listedNfts, isFetching: fetchingListedNfts } = useMoralis(
        "ActiveItem",
        (query) => query.limit(10).decending("tokenId")
    )

    console.log(listedNfts)

    return (
        <div className="container mx-auto">
            <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
            <div className="flex flex-wrap">
                {isWeb3Enabled ? (
                    fetchingListedNfts ? (
                        <div>Loading...</div>
                    ) : (
                        listedNfts.map((nft) => {
                            console.log(nft.attributes)
                            const { price, nftAddress, tokenId, marketplaceAddress, seller } =
                                nft.attributes
                            return (
                                <div>
                                    {/* Price: {price}
                                NftAddress: {nftAddress}
                                TokenId: {tokenId}
                                seller: {seller} */}
                                    <NFTBox
                                        price={price}
                                        nftAddress={nftAddress}
                                        tokenId={tokenId}
                                        marketplaceAddress={marketplaceAddress}
                                        seller={seller}
                                        key={`${nftAddress}${tokenId}`}
                                    />
                                </div>
                            )
                        })
                    )
                ) : (
                    <div>Web3 Currently not Enabled</div>
                )}
            </div>
        </div>
    )
}
