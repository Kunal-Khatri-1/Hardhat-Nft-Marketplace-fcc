const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Unit tests for NFT Marketplace", function () {
          console.log("Unit test Starting")
          let nftMarketplace, playerConnectedNftMarketplace, basicNft, deployer, player
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer

              // Preffering this option because => .connect is expecting arguement of type account and the getNamedAccount is of different type
              // player = await getNamedAccounts().player
              const accounts = await ethers.getSigners()
              player = accounts[1]

              await deployments.fixture(["all"])

              // getContract defaults to connect with whatever account is at account 0
              // to call a function on NFT marketplace =>
              // nftMarketplace2 = await nftmarketplace.connect(player)
              nftMarketplace = await ethers.getContract("NftMarketplace")
              playerConnectedNftMarketplace = await nftMarketplace.connect(player)
              basicNft = await ethers.getContract("BasicNft")

              await basicNft.mintNft()

              // Approving to send it to the marketplace
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })

          it("lists and can be bought", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                  value: PRICE,
              })

              const newOwner = await basicNft.ownerOf(TOKEN_ID)
              const deployerProceeds = await nftMarketplace.getProceeds(deployer)

              // have to do player.address instead of player because we used getSigners over getNamedAccount
              assert.equal(newOwner.toString(), player.address)
              assert.equal(deployerProceeds.toString(), PRICE.toString())
          })

          it("checking for exclusivity of the NFT requested to be listed", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

              const error = `NftMarketPlace__AlreadyListed("${basicNft.address}", ${TOKEN_ID})`

              await expect(
                  nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              ).to.be.revertedWith(error)
          })
      })
