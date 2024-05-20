import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { getTokenAmountWei } from "./shared/utils";

describe("Market", function () {
  describe("merge", function () {
    it("merge revert", async function () {
      const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

      let nftOwnerT1_1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1_2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2_1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2_2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];

      // create t1 t2 token
      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwnerT1_1.address,
        onftOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(paramsT1.tid, paramsT1.tData, paramsT1.cnftOwner, paramsT1.onftOwner);
      let paramsT2 = {
        tid: "t2",
        tData: "0x22",
        cnftOwner: nftOwnerT2_1.address,
        onftOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(paramsT2.tid, paramsT2.tData, paramsT2.cnftOwner, paramsT2.onftOwner);


      let max = BigInt(10) ** BigInt(18) * BigInt(1000000);
      let approveValue = max * BigInt(100);
      await info.simpleToken.transfer(user1.address, approveValue)
      await info.simpleToken.transfer(user2.address, approveValue)
      await info.simpleToken.connect(user1).approve(await info.market.getAddress(), approveValue)
      await info.simpleToken.connect(user2).approve(await info.market.getAddress(), approveValue)

      // user1 buy and mortgage 10000 t1 token=1
      await info.market
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000));
      await info.market.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));

      await expect(info.market.connect(user1).cash(1, getTokenAmountWei(1000))).revertedWith("CE");

      // user1 buy and mortgage 20000 t1 token=2
      await info.market
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000));
      await info.market.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.market
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000));
      await info.market.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.market
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000));
      await info.market.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.market
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000));
      await info.market.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.market
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000));
      await info.market.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.market
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000));
      await info.market.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.market
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000));
      await info.market.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));
      //
      // merge not tokenid
      await expect(info.market.connect(user1).merge(1, 10)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken");
      await expect(info.market.connect(user1).merge(10, 1)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken");
      await expect(info.market.connect(user1).merge(9, 10)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken");
      // merge deleted tokenid
      // redeem 7 and 3
      await info.market.connect(user2).redeem(7, getTokenAmountWei(35000));
      await info.market.connect(user1).redeem(3, getTokenAmountWei(30000));
      await expect(info.mortgageNFT.ownerOf(7)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken");
      await expect(info.mortgageNFT.ownerOf(3)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken");

      await expect(info.market.connect(user1).merge(1, 7)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken");
      await expect(info.market.connect(user1).merge(7, 1)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken");
      await expect(info.market.connect(user1).merge(7, 3)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken");

      // merge other user tokenid
      await expect(info.market.connect(user1).merge(1, 5)).rejectedWith("AOE2");
      await expect(info.market.connect(user1).merge(5, 1)).rejectedWith("AOE1");

      // merge other tid tokenid
      await expect(info.market.connect(user1).merge(1, 4)).rejectedWith("TE");
    });

    it("merge self nft smail merge big and result", async function () {
      const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

      let nftOwnerT1_1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1_2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2_1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2_2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];

      // create t1 t2 token
      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwnerT1_1.address,
        onftOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(paramsT1.tid, paramsT1.tData, paramsT1.cnftOwner, paramsT1.onftOwner);
      let paramsT2 = {
        tid: "t2",
        tData: "0x22",
        cnftOwner: nftOwnerT2_1.address,
        onftOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(paramsT2.tid, paramsT2.tData, paramsT2.cnftOwner, paramsT2.onftOwner);


      let max = BigInt(10) ** BigInt(18) * BigInt(1000000);
      let approveValue = max * BigInt(100);
      await info.simpleToken.transfer(user1.address, approveValue)
      await info.simpleToken.transfer(user2.address, approveValue)
      await info.simpleToken.connect(user1).approve(await info.market.getAddress(), approveValue)
      await info.simpleToken.connect(user2).approve(await info.market.getAddress(), approveValue)

      // user1 buy and mortgage 10000 t1 token=1
      await info.market
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000));
      await info.market.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));

      await expect(info.market.connect(user1).cash(1, getTokenAmountWei(1000))).revertedWith("CE");

      // user1 buy and mortgage 20000 t1 token=2
      await info.market
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000));
      await info.market.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.market
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000));
      await info.market.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.market
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000));
      await info.market.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.market
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000));
      await info.market.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.market
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000));
      await info.market.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.market
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000));
      await info.market.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.market
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000));
      await info.market.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));

      expect(await info.mortgageNFT.ownerOf(1)).eq(user1.address);
      expect((await info.mortgageNFT.info(1)).amount).eq(getTokenAmountWei(10000));
      expect((await info.mortgageNFT.info(1)).tid).eq(paramsT1.tid);

      expect(await info.mortgageNFT.ownerOf(2)).eq(user1.address);
      expect((await info.mortgageNFT.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFT.info(2)).tid).eq(paramsT1.tid);

      expect(await info.market.balanceOf(paramsT1.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.market.balanceOf(paramsT2.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.market.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.market.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.market.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.market.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.market.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.market.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_1 = await info.simpleToken.balanceOf(user2.address);
      let market_payToken_1 = await info.simpleToken.balanceOf(await info.market.getAddress());
      let mortgage_payToken_1 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);

      let nftOwnerT1_1_Eth = await info.simpleToken.balanceOf(nftOwnerT1_1);
      let nftOwnerT1_2_Eth = await info.simpleToken.balanceOf(nftOwnerT1_2);
      let nftOwnerT2_1_Eth = await info.simpleToken.balanceOf(nftOwnerT2_1);
      let nftOwnerT2_2_Eth = await info.simpleToken.balanceOf(nftOwnerT2_2);

      let user_get_payToken_1 = await info.market.connect(user1).merge.staticCall(1, 2);
      await info.market.connect(user1).merge(1, 2);

      expect(await info.mortgageNFT.ownerOf(1)).eq(user1.address);
      expect((await info.mortgageNFT.info(1)).amount).eq(getTokenAmountWei(10000) + getTokenAmountWei(20000));
      expect((await info.mortgageNFT.info(1)).tid).eq(paramsT1.tid);

      await expect(info.mortgageNFT.ownerOf(2)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken");
      expect((await info.mortgageNFT.info(2)).amount).eq("");
      expect((await info.mortgageNFT.info(2)).tid).eq("");

      expect(await info.market.balanceOf(paramsT1.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.market.balanceOf(paramsT2.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.market.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.market.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.market.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.market.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.market.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.market.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_Eth);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_Eth);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_Eth);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_Eth);

      let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_2 = await info.simpleToken.balanceOf(user2.address);
      let market_payToken_2 = await info.simpleToken.balanceOf(await info.market.getAddress());
      let mortgage_payToken_2 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);

      expect(user2_payToken_2).eq(user2_payToken_1);

      let curve_nft_1_new = await info.market.getPayTokenAmount(0, getTokenAmountWei(30000));
      let curve_nft_1_old = await info.market.getPayTokenAmount(0, getTokenAmountWei(10000));
      let curve_nft_2_old = await info.market.getPayTokenAmount(0, getTokenAmountWei(20000));
      expect(market_payToken_1 - market_payToken_2).eq(curve_nft_1_new - curve_nft_1_old - curve_nft_2_old);
      expect(market_payToken_1 - market_payToken_2).eq(
        user1_payToken_2 - user1_payToken_1 + (mortgage_payToken_2 - mortgage_payToken_1),
      );
      expect((market_payToken_1 - market_payToken_2) / (mortgage_payToken_2 - mortgage_payToken_1)).eq(1000);

      expect(user1_payToken_2 - user1_payToken_1).eq(user_get_payToken_1);

      // end
      expect(await info.market.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.market.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect((await info.mortgageNFT.info(1)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFT.info(2)).tid).eq("");
      expect((await info.mortgageNFT.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFT.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFT.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFT.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFT.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFT.info(8)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFT.info(1)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFT.info(2)).amount).eq(0);
      expect((await info.mortgageNFT.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFT.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFT.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFT.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFT.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFT.info(8)).amount).eq(getTokenAmountWei(45000));

      let payToken_add =
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(70000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(150000)));
      let payToken_remove =
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(40000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(15000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(25000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(35000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(45000)));

      expect(payToken_add - payToken_remove).eq(await info.simpleToken.balanceOf(await info.market.getAddress()));
    });

    it("merge self nft big merge smail", async function () {
      const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

      let nftOwnerT1_1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1_2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2_1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2_2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];

      // create t1 t2 token
      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwnerT1_1.address,
        onftOwner: nftOwnerT1_2.address,
      };
      await info.appOperator
        .createToken(paramsT1.tid, paramsT1.tData, paramsT1.cnftOwner, paramsT1.onftOwner);
      let paramsT2 = {
        tid: "t2",
        tData: "0x22",
        cnftOwner: nftOwnerT2_1.address,
        onftOwner: nftOwnerT2_2.address,
      };
      await info.appOperator
        .createToken(paramsT2.tid, paramsT2.tData, paramsT2.cnftOwner, paramsT2.onftOwner);


      let max = BigInt(10) ** BigInt(18) * BigInt(1000000);
      let approveValue = max * BigInt(100);
      await info.simpleToken.transfer(user1.address, approveValue)
      await info.simpleToken.transfer(user2.address, approveValue)
      await info.simpleToken.connect(user1).approve(await info.market.getAddress(), approveValue)
      await info.simpleToken.connect(user2).approve(await info.market.getAddress(), approveValue)

      // user1 buy and mortgage 10000 t1 token=1
      await info.market
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(10000));
      await info.market.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(10000));

      await expect(info.market.connect(user1).cash(1, getTokenAmountWei(1000))).revertedWith("CE");

      // user1 buy and mortgage 20000 t1 token=2
      await info.market
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(20000));
      await info.market.connect(user1).mortgage(paramsT1.tid, getTokenAmountWei(20000));
      // user1 buy and mortgage 30000 t2 token=3
      await info.market
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(30000));
      await info.market.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(30000));
      // user1 buy and mortgage 40000 t2 token=4
      await info.market
        .connect(user1)
        .buy(paramsT2.tid, getTokenAmountWei(40000));
      await info.market.connect(user1).mortgage(paramsT2.tid, getTokenAmountWei(40000));
      // user2 buy and mortgage 15000 t1 token=5
      await info.market
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(15000));
      await info.market.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(15000));
      // user2 buy and mortgage 25000 t1 token=6
      await info.market
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(25000));
      await info.market.connect(user2).mortgage(paramsT1.tid, getTokenAmountWei(25000));
      // user2 buy and mortgage 35000 t2 token=7
      await info.market
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(35000));
      await info.market.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(35000));
      // user2 buy and mortgage 45000 t2 token=8
      await info.market
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(45000));
      await info.market.connect(user2).mortgage(paramsT2.tid, getTokenAmountWei(45000));

      expect(await info.mortgageNFT.ownerOf(1)).eq(user1.address);
      expect((await info.mortgageNFT.info(1)).amount).eq(getTokenAmountWei(10000));
      expect((await info.mortgageNFT.info(1)).tid).eq(paramsT1.tid);

      expect(await info.mortgageNFT.ownerOf(2)).eq(user1.address);
      expect((await info.mortgageNFT.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFT.info(2)).tid).eq(paramsT1.tid);

      expect(await info.market.balanceOf(paramsT1.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.market.balanceOf(paramsT2.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.market.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.market.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.market.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.market.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.market.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.market.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_1 = await info.simpleToken.balanceOf(user2.address);
      let market_payToken_1 = await info.simpleToken.balanceOf(await info.market.getAddress());
      let mortgage_payToken_1 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);

      let nftOwnerT1_1_Eth = await info.simpleToken.balanceOf(nftOwnerT1_1);
      let nftOwnerT1_2_Eth = await info.simpleToken.balanceOf(nftOwnerT1_2);
      let nftOwnerT2_1_Eth = await info.simpleToken.balanceOf(nftOwnerT2_1);
      let nftOwnerT2_2_Eth = await info.simpleToken.balanceOf(nftOwnerT2_2);

      await info.market.connect(user1).merge(2, 1);

      await expect(info.mortgageNFT.ownerOf(1)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken");
      expect((await info.mortgageNFT.info(1)).amount).eq(0);
      expect((await info.mortgageNFT.info(1)).tid).eq("");

      expect(await info.mortgageNFT.ownerOf(2)).eq(user1.address);
      expect((await info.mortgageNFT.info(2)).amount).eq(getTokenAmountWei(10000) + getTokenAmountWei(20000));
      expect((await info.mortgageNFT.info(2)).tid).eq(paramsT1.tid);

      expect(await info.market.balanceOf(paramsT1.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.market.balanceOf(paramsT2.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(150000),
      );

      expect(await info.market.balanceOf(paramsT1.tid, user1.address)).eq(0);
      expect(await info.market.balanceOf(paramsT1.tid, user2.address)).eq(0);
      expect(await info.market.balanceOf(paramsT2.tid, user1.address)).eq(0);
      expect(await info.market.balanceOf(paramsT2.tid, user2.address)).eq(0);

      expect(await info.market.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.market.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect(await info.simpleToken.balanceOf(nftOwnerT1_1)).eq(nftOwnerT1_1_Eth);
      expect(await info.simpleToken.balanceOf(nftOwnerT1_2)).eq(nftOwnerT1_2_Eth);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_1)).eq(nftOwnerT2_1_Eth);
      expect(await info.simpleToken.balanceOf(nftOwnerT2_2)).eq(nftOwnerT2_2_Eth);

      let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_2 = await info.simpleToken.balanceOf(user2.address);
      let market_payToken_2 = await info.simpleToken.balanceOf(await info.market.getAddress());
      let mortgage_payToken_2 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);

      expect(user2_payToken_2).eq(user2_payToken_1);

      let curve_nft_2_new = await info.market.getPayTokenAmount(0, getTokenAmountWei(30000));
      let curve_nft_1_old = await info.market.getPayTokenAmount(0, getTokenAmountWei(10000));
      let curve_nft_2_old = await info.market.getPayTokenAmount(0, getTokenAmountWei(20000));
      expect(market_payToken_1 - market_payToken_2).eq(curve_nft_2_new - curve_nft_1_old - curve_nft_2_old);
      expect(market_payToken_1 - market_payToken_2).eq(
        user1_payToken_2 - user1_payToken_1 + (mortgage_payToken_2 - mortgage_payToken_1),
      );
      expect((market_payToken_1 - market_payToken_2) / (mortgage_payToken_2 - mortgage_payToken_1)).eq(1000);

      // end
      expect(await info.market.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.market.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      expect((await info.mortgageNFT.info(1)).tid).eq("");
      expect((await info.mortgageNFT.info(2)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFT.info(3)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFT.info(4)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFT.info(5)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFT.info(6)).tid).eq(paramsT1.tid);
      expect((await info.mortgageNFT.info(7)).tid).eq(paramsT2.tid);
      expect((await info.mortgageNFT.info(8)).tid).eq(paramsT2.tid);

      expect((await info.mortgageNFT.info(1)).amount).eq(0);
      expect((await info.mortgageNFT.info(2)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFT.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFT.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFT.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFT.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFT.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFT.info(8)).amount).eq(getTokenAmountWei(45000));

      let payToken_add =
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(70000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(150000)));
      let payToken_remove =
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(30000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(40000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(15000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(25000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(35000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(45000)));

      expect(payToken_add - payToken_remove).eq(await info.simpleToken.balanceOf(await info.market.getAddress()));
    });
  });
});
