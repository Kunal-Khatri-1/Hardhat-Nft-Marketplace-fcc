// automatically run th query the instant our index pops up
// get all the active items from database
import { useQuery } from "@apollo/client"
import { useMoralis } from "react-moralis"
import NFTBox from "../components/NFTBox"
import networkMapping from "../constants/networkMapping.json"
import GET_ACTIVE_ITEMS from "../constants/subgraphQueries"

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
    const { isWeb3Enabled, chainId } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    console.log(`chainString: ${chainString}`)
    const marketplaceAddress = networkMapping[chainString].NftMarketplace[0]

    // this should return listed NFTs
    const { loading, error, data: listedNfts } = useQuery(GET_ACTIVE_ITEMS)

    return (
        <div className="container mx-auto">
            <h1 className=" py-16 px-4 font-bold text-3xl text-center">Explore Marketplace</h1>
            <div className="w-10/12 m-auto">
                <div className=" grid grid-cols-4 place-items-center gap-6">
                    {isWeb3Enabled ? (
                        loading || !listedNfts ? (
                            <div>Loading...</div>
                        ) : (
                            // listedNfts.activeItems.map() NOT listedNfts.map()
                            listedNfts.activeItems.map((nft) => {
                                console.log(nft)
                                const { price, nftAddress, tokenId, seller } = nft
                                return (
                                    <div>
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
        </div>
    )
}
