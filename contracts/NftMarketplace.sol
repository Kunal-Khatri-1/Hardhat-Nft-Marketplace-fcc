// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

//////////////////////
// ERRORS //
/////////////////////

error NftMarketPlace__PriceMustBeAboveZero();
error NftMarketPlace__NotApprovedForMarketPlace();
error NftMarketPlace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketPlace__NotOwner();
error NftMarketPlace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 listedPrice);
error NftMarketplace__NotProceeds();
error NftMarketplace__TransferFailed();

contract NftMarketplace is ReentrancyGuard {
    //////////////////////
    // TYPE DECLARATIONS //
    /////////////////////
    struct Listing {
        uint256 price;
        address seller;
    }

    //////////////////////
    // EVENTS //
    /////////////////////
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 tokenId);

    //////////////////////
    // NFT MARKETPLACE //
    /////////////////////
    // NFT Contract address => NFt tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;

    // keeping track of how much money people have earned by selling their NFTs
    // Seller address => Amount earned
    mapping(address => uint256) private s_proceeds;

    //////////////////////
    // MODIFIERS //
    /////////////////////
    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketPlace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);

        if (spender != owner) {
            revert NftMarketPlace__NotOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NftMarketPlace__NotListed(nftAddress, tokenId);
        }
        _;
    }

    //////////////////////
    // NFT MARKETPLACE Functions //
    /////////////////////

    /**
     * @notice function for listing NFT to the Marketplace
     * @param nftAddress: address of the NFT contract
     * @param tokenId: the token Id of the NFT
     * @param price: sale price of the listed NFT
     * @dev 1. Send the NFT to the contract. Transfer => Contract hold the NFT(escrow method)
                1.1 Gas expensive to list NFTs
                1.2 Marketplace will hold the NFT and the user will not be able to claim that its his/her NFT
                    1.2.1 technically they could by withdrawing the NFT

        2. Owners can still hold their NFT, and give the marketplace approval to sell the NFT for them(using this approach)
     */

    // MAIN FUNCTIONS
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        // challenge: Have this contract accept payment in a subset of tokens as well using chanlink pricefeeds to convert the price of the tokens between each other
        notListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert NftMarketPlace__PriceMustBeAboveZero();
        }

        IERC721 nft = IERC721(nftAddress);
        // checking if marketplace contract is the operator for the NFT
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketPlace__NotApprovedForMarketPlace();
        }

        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);

        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(address nftAddress, uint256 tokenId)
        external
        payable
        nonReentrant
        isListed(nftAddress, tokenId)
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];

        if (msg.value < listedItem.price) {
            revert NftMarketplace__PriceNotMet(nftAddress, tokenId, listedItem.price);
        }

        // We don't just send seller the money
        // solidity concept => PULL OVER PUSH
        //      shift the risk associated with transferring Ether to the user
        s_proceeds[listedItem.seller] = s_proceeds[listedItem.seller] + msg.value;

        // removing the bough NFT from the listing
        delete (s_listings[nftAddress][tokenId]);

        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        // event might not be safe from reentrancy attacks
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function cancelListing(address nftAddress, uint256 tokenId)
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        delete s_listings[nftAddress][tokenId];
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isListed(nftAddress, tokenId) isOwner(nftAddress, tokenId, msg.sender) {
        s_listings[nftAddress][tokenId].price = newPrice;

        // essentially by updating we are relisting the NFT
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];

        if (proceeds <= 0) {
            revert NftMarketplace__NotProceeds();
        }

        s_proceeds[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: proceeds}("");

        if (!success) {
            revert NftMarketplace__TransferFailed();
        }
    }

    //////////////////////
    // Getter Functions //
    /////////////////////

    function getListing(address nftAddress, uint256 tokenId)
        external
        view
        returns (Listing memory)
    {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}

// 1. create a decentralized NFT marketplace
//     1. `listItem`: list NFTs to the marketplace
//     2. `buyItem`: Buy the NFTs
//     3. `CancelListing`: Cancel a Listing
//     4. `updateListing`: Update Price
//     5. `withdrawProceeds`: Withdraw payment for the bought NFTs
