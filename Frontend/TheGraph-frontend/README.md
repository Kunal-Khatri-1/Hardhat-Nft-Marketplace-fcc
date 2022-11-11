1. TheGraph

    1. TheGraph is a network of different nodes that read from blockchains and indexes data. It exposes an API for us to call so that we can read that data.
    2. Indexing protocol for querying blockchain networks like Ethereum, other EVM compatible blockchains, Near and IPFS
    3. Using TheGraph developers can build and publish open APIs called subgraphs that they can then use in their applications to enable better querying capabilities of data stored on these networks,including features like filtering, sorting, relational data and full stack search.

        1. Subgraphs live in between the blockchain and the UI providing an important piece of software infrastructure, a flexible performant and decentralized API layer,

    4. The traditional tech stack databases, servers and APIs query, filter, sort, paginate, group and join data before it is returned to an application, usually via some http request. These type of data transformations are not possible when reading from Ethereum and other blockchains

    5. In a blockchain data isn't stored in a format that can be easily or efficiently consumed, retrieved directly from other applications and frontends.
        1. The problem is that you need to have data indexed and organized for efficient retrieval.
            1. Traditionally, that's the work the databases and web servers do in the centralized tech stack but that layer was missing in the web3 stack
    6. Indexing Examples:

        1. Search engines: search engines like Google crawl the internet indexing relevant data, making it available for the users to search via their web interface
            1. Without this indexing layer, it will be hard for us to know where and how to find relevant information across the web
        2. Library: Using an indexing system we know where to find a book that we are looking for without having to go through book by book throught the library.

    7. Bulding a subgraph:
        1. Install TheGraph CLI
            1. `yarn global add @graphprotocol/graph-cli`
            2. Its just CLI that will help us build a graph and build instructions for the graph to actually start indexing our events
        2. Use the graph CLI to scaffold out an empty graph boilerplate that you can then update with your own contract information.
        3. In your subgraph configuration, define things like data model, the network, the contract addresses and other configurations that are specific to the data you would like to index.
        4. Deploy subgraph to use it in application using TheGraph CLI running the deploy command:
            1. `graph deploy --studio <subgraph-name>`
        5. Once the subgraph is deployed and the data begins to be indexed we can start testing it out using the UI from TheGraph dashboard
        6. When we are ready to query our subgraph from our application, we can use the API URL that's been given to us by TheGraph along with any TheGraph query.

2. Home Page
    1. Show recently listed NFTs
        1. If you own the NFT, you can update the listing
        2. If not, you can buy the listing
3. Sell Page
    1. You can list your Nft on the marketplace
    2. withdraw proceeds
