// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

pragma solidity ^0.8.7;

contract BasicNft is ERC721 {
    // TOKEN_URI will never change
    string public constant TOKEN_URI =
        "ipfs://bafybeiaegmptojd57yxwvui44zjx3ccixquumwkhv3ycej6zzwujfh7nti/";

    uint256 private s_tokenCounter;

    // EVENTS
    event BirdieMinted(uint256);

    constructor() ERC721("Birdie", "BRD") {
        s_tokenCounter = 0;
    }

    // use _safeMint function of openzeppelin ERC721
    // if you have collection of tokens on the same smart contract, each one of them need their unique tokenId
    function mintNft() public returns (uint256) {
        console.log("mintNft was called");
        // mint the token to whoever calls this mint function

        s_tokenCounter = s_tokenCounter + 1;
        console.log("s_tokenCounter increased");

        _safeMint(msg.sender, s_tokenCounter);
        console.log("_safeMint was called");

        emit BirdieMinted(s_tokenCounter);
        console.log("BirdMinted was emitted");

        console.log("nftMinted Ended");
        return s_tokenCounter;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return TOKEN_URI;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    // tokenURI => function that tells how the NFT looks like
    // the tokenURI returns URL which returns some JSON
    // the returned JSON image part, this contains a URL that points to the image
    // image url can be hosted anywhere but ideally not going to use centralized server
    // instead hosting it onchain or on IPFS
}
