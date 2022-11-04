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
              // this gives address type and not account type
              // not convinient for tests
              // deployer = (await getNamedAccounts()).deployer
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              // Preffering this option because => .connect is expecting arguement of type account and the getNamedAccount is of different type
              // player = await getNamedAccounts().player
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
              const deployerProceeds = await nftMarketplace.getProceeds(deployer.address)

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

          it("needs approval to list item", async function () {
              // Clearing nft marketplace approval
              await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
              await expect(
                  nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              ).to.be.revertedWith("NftMarketPlace__NotApprovedForMarketPlace()")
          })

          it("listing mapping is correctly updated", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)

              assert.equal(listing.price.toString(), PRICE.toString())
              // have to use deployer.address and NOT deployer
              assert.equal(listing.seller.toString(), deployer.address)
          })

          describe("cancel listing", function () {
              it("reverts if there is no listing", async function () {
                  const error = `NftMarketPlace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })
              it("reverts if anyone other than the owner tries to call", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await basicNft.approve(player.address, TOKEN_ID)
                  await expect(
                      playerConnectedNftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketPlace__NotOwner")
              })
              it("emits event and removes listing", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      "ItemCanceled"
                  )
                  // after the NFT is removed/canceled it should not be present in s_listings
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert.equal(listing.price.toString(), "0")
              })
          })
          describe("BuyItem", function () {
              it("reverts if the item isn't listed", async function () {
                  const error = `NftMarketPlace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })
              // LOOSE ERROR
              it("reverts if the price isnt met", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("PriceNotMet")
              })
              it("transfers the nft to the buyer and updates internal proceeds record", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(
                      await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.emit("ItemBought")
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketplace.getProceeds(deployer.address)
                  assert.equal(newOwner.toString(), player.address)
                  assert.equal(deployerProceeds.toString(), PRICE.toString())
              })
          })
          describe("updateListing", function () {
              it("must be owner and listed", async function () {
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketPlace__NotListed")
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      playerConnectedNftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWith("NftMarketPlace__NotOwner")
              })
              it("updates the price of the item", async function () {
                  const updatedPrice = ethers.utils.parseEther("0.2")
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  // await
                  expect(
                      await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, updatedPrice)
                  ).to.emit("ItemListed")
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert.equal(listing.price.toString(), updatedPrice.toString())
              })
          })
          describe("withdrawProceeds", function () {
              it("doesn't allow 0 proceed withdrawls", async function () {
                  await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
                      "NftMarketplace__NotProceeds"
                  )
              })
              it("withdraws proceeds", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })

                  const deployerProceedsBefore = await nftMarketplace.getProceeds(deployer.address)
                  const deployerBalanceBefore = await deployer.getBalance()
                  const txResponse = await nftMarketplace.withdrawProceeds()
                  const transactionReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const deployerBalanceAfter = await deployer.getBalance()

                  assert.equal(
                      deployerBalanceAfter.add(gasCost).toString(),
                      deployerProceedsBefore.add(deployerBalanceBefore).toString()
                  )
              })
          })
      })
