import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { getTokenAmountWei } from "./shared/utils";

describe("Market", function () {
  describe("cash", function () {
    it("cash revert", async function () {
      const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

      let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];
      let user2 = info.wallets[info.nextWalletIndex + 4];

      let params = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwner1.address,
        onftOwner: nftOwner2.address,
      };
      await info.appOperator
        .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

      let max = BigInt(10) ** BigInt(18) * BigInt(1000000);
      let approveValue = max * BigInt(100);
      await info.simpleToken.transfer(user1.address, approveValue)
      await info.simpleToken.transfer(user2.address, approveValue)
      await info.simpleToken.connect(user1).approve(await info.market.getAddress(), approveValue)
      await info.simpleToken.connect(user2).approve(await info.market.getAddress(), approveValue)

      await info.market
        .connect(user1)
        .buy(params.tid, getTokenAmountWei(1000));
      await info.market
        .connect(user2)
        .buy(params.tid, getTokenAmountWei(1000));
      await info.market.connect(user1).mortgage(params.tid, getTokenAmountWei(1000));
      await info.market.connect(user2).mortgage(params.tid, getTokenAmountWei(1000));
      expect(await info.mortgageNFT.ownerOf(1)).eq(user1.address);
      expect(await info.mortgageNFT.ownerOf(2)).eq(user2.address);
      await info.market
        .connect(user1)
        .redeem(1, getTokenAmountWei(1000));
      await expect(info.mortgageNFT.ownerOf(1)).revertedWith("ERC721: invalid token ID");
      // cash not tokenid
      await expect(info.market.connect(user1).cash(5, 100)).revertedWith("ERC721: invalid token ID");
      // cash deleted tokenid
      await expect(info.market.connect(user1).cash(1, 10)).revertedWith("ERC721: invalid token ID");
      // cash other user tokenid
      await expect(info.market.connect(user1).cash(2, 10)).revertedWith("AOE");

      // cash not enough
      await expect(info.market.connect(user2).cash(2, getTokenAmountWei(3000))).revertedWith("TAE");
      // cash 0
      await expect(info.market.connect(user2).cash(2, 0)).revertedWith("TAE");
      // cash no payToken get
      await expect(info.market.connect(user2).cash(2, getTokenAmountWei(10))).revertedWith("CE");
    });

    it("cash", async function () {
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

      /**
       * cash (redeem and sell)
       * cash part success ok
       * nft amount change - ok
       * market token change - ok
       * total supoort - ok
       * user token no change ok
       * user get payToken ok
       * mortgage no payToken ok
       * cnft add payToken ok
       * onft add payToken ok
       * curve_sell - cnft_fee - onft_fee - curve_redeem = user get payToken ok
       */
      let user1_tid1_0 = await info.market.balanceOf(paramsT1.tid, user1.address);
      let user1_tid2_0 = await info.market.balanceOf(paramsT2.tid, user1.address);
      let user2_tid1_0 = await info.market.balanceOf(paramsT1.tid, user2.address);
      let user2_tid2_0 = await info.market.balanceOf(paramsT2.tid, user2.address);

      let user1_payToken_0 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_0 = await info.simpleToken.balanceOf(user2.address);
      let mortgage_payToken_0 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let nftOwnerT1_1_payToken_0 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_0 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_0 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_0 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let market_payToken_0 = await info.simpleToken.balanceOf(await info.market.getAddress());

      let curve_sell_0 = await info.market.getSellPayTokenAmount(paramsT1.tid, getTokenAmountWei(1000));
      expect(curve_sell_0).eq(
        await info.market.getPayTokenAmount(getTokenAmountWei(70000) - getTokenAmountWei(1000), getTokenAmountWei(1000)),
      );
      let curve_redeem_0 = await info.market.getPayTokenAmount(
        getTokenAmountWei(10000) - getTokenAmountWei(1000),
        getTokenAmountWei(1000),
      );

      expect((await info.mortgageNFT.info(1)).amount).eq(getTokenAmountWei(10000));
      expect(await info.market.balanceOf(paramsT1.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(70000),
      );
      expect(await info.market.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000));
      expect(await info.market.balanceOf(paramsT2.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(150000),
      );
      expect(await info.market.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let userGetPayToken_0 = await info.market.connect(user1).cash.staticCall(1, getTokenAmountWei(1000));
      await info.market.connect(user1).cash(1, getTokenAmountWei(1000));

      expect((await info.mortgageNFT.info(1)).amount).eq(getTokenAmountWei(10000) - getTokenAmountWei(1000));
      expect(await info.market.balanceOf(paramsT1.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(70000) - getTokenAmountWei(1000),
      );
      expect(await info.market.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(70000) - getTokenAmountWei(1000));
      expect(await info.market.balanceOf(paramsT2.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(150000),
      );
      expect(await info.market.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let user1_tid1_1 = await info.market.balanceOf(paramsT1.tid, user1.address);
      let user1_tid2_1 = await info.market.balanceOf(paramsT2.tid, user1.address);
      let user2_tid1_1 = await info.market.balanceOf(paramsT1.tid, user2.address);
      let user2_tid2_1 = await info.market.balanceOf(paramsT2.tid, user2.address);

      let user1_payToken_1 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_1 = await info.simpleToken.balanceOf(user2.address);
      let mortgage_payToken_1 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let nftOwnerT1_1_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_1 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let market_payToken_1 = await info.simpleToken.balanceOf(await info.market.getAddress());

      let nftOwnerT1_2_add = nftOwnerT1_2_payToken_1 - nftOwnerT1_2_payToken_0;
      let nftOwnerT1_1_add = nftOwnerT1_1_payToken_1 - nftOwnerT1_1_payToken_0;

      expect(user1_tid1_1).eq(user1_tid1_0);
      expect(user1_tid2_1).eq(user1_tid2_0);
      expect(user2_tid1_1).eq(user2_tid1_0);
      expect(user2_tid2_1).eq(user2_tid2_0);

      expect(mortgage_payToken_1).eq(mortgage_payToken_0);

      expect(nftOwnerT2_1_payToken_1).eq(nftOwnerT2_1_payToken_0);
      expect(nftOwnerT2_2_payToken_1).eq(nftOwnerT2_2_payToken_0);

      expect(nftOwnerT1_2_add / nftOwnerT1_1_add).eq(19);
      expect(curve_sell_0 / (nftOwnerT1_2_add + nftOwnerT1_1_add)).eq(100);

      expect(user1_payToken_1 - user1_payToken_0).gt(0);
      expect(user1_payToken_1 - user1_payToken_0).eq(userGetPayToken_0);

      expect(curve_sell_0 - nftOwnerT1_2_add - nftOwnerT1_1_add - curve_redeem_0).eq(user1_payToken_1 - user1_payToken_0);

      expect(market_payToken_0 - market_payToken_1)
        .eq(user1_payToken_1 - user1_payToken_0 + nftOwnerT1_2_add + nftOwnerT1_1_add)
        .eq(curve_sell_0 - curve_redeem_0);

      expect(user2_payToken_1).eq(user2_payToken_0);

      // user1 cash 9000 t1 token1
      let curve_sell_1 = await info.market.getSellPayTokenAmount(paramsT1.tid, getTokenAmountWei(9000));
      expect(curve_sell_1).eq(
        await info.market.getPayTokenAmount(
          getTokenAmountWei(70000) - getTokenAmountWei(1000) - getTokenAmountWei(9000),
          getTokenAmountWei(9000),
        ),
      );
      let curve_redeem_1 = await info.market.getPayTokenAmount(0, getTokenAmountWei(9000));

      let user1_payToken_2_before = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_2_before = await info.simpleToken.balanceOf(user2.address);

      await info.market.connect(user1).cash(1, getTokenAmountWei(9000));

      await expect(info.mortgageNFT.ownerOf(1)).revertedWith("ERC721: invalid token ID");
      expect((await info.mortgageNFT.info(1)).amount).eq(
        getTokenAmountWei(10000) - getTokenAmountWei(1000) - getTokenAmountWei(9000),
      );
      expect(await info.market.balanceOf(paramsT1.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(70000) - getTokenAmountWei(1000) - getTokenAmountWei(9000),
      );
      expect(await info.market.totalSupply(paramsT1.tid)).eq(
        getTokenAmountWei(70000) - getTokenAmountWei(1000) - getTokenAmountWei(9000),
      );
      expect(await info.market.balanceOf(paramsT2.tid, await info.market.getAddress())).eq(
        getTokenAmountWei(150000),
      );
      expect(await info.market.totalSupply(paramsT2.tid)).eq(getTokenAmountWei(150000));

      let user1_tid1_2 = await info.market.balanceOf(paramsT1.tid, user1.address);
      let user1_tid2_2 = await info.market.balanceOf(paramsT2.tid, user1.address);
      let user2_tid1_2 = await info.market.balanceOf(paramsT1.tid, user2.address);
      let user2_tid2_2 = await info.market.balanceOf(paramsT2.tid, user2.address);

      let user1_payToken_2 = await info.simpleToken.balanceOf(user1.address);
      let user2_payToken_2 = await info.simpleToken.balanceOf(user2.address);
      let mortgage_payToken_2 = await info.simpleToken.balanceOf(info.mortgageFeeWallet.address);
      let nftOwnerT1_1_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT1_1.address);
      let nftOwnerT1_2_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT1_2.address);
      let nftOwnerT2_1_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT2_1.address);
      let nftOwnerT2_2_payToken_2 = await info.simpleToken.balanceOf(nftOwnerT2_2.address);
      let market_payToken_2 = await info.simpleToken.balanceOf(await info.market.getAddress());

      let nftOwnerT1_2_add_1 = nftOwnerT1_2_payToken_2 - nftOwnerT1_2_payToken_1;
      let nftOwnerT1_1_add_1 = nftOwnerT1_1_payToken_2 - nftOwnerT1_1_payToken_1;

      expect(user1_tid1_2).eq(user1_tid1_1);
      expect(user1_tid2_2).eq(user1_tid2_1);
      expect(user2_tid1_2).eq(user2_tid1_1);
      expect(user2_tid2_2).eq(user2_tid2_1);

      expect(mortgage_payToken_2).eq(mortgage_payToken_1);

      expect(nftOwnerT2_1_payToken_2).eq(nftOwnerT2_1_payToken_1);
      expect(nftOwnerT2_2_payToken_2).eq(nftOwnerT2_2_payToken_1);

      expect(nftOwnerT1_2_add_1 / nftOwnerT1_1_add_1).eq(19);
      expect(curve_sell_1 / (nftOwnerT1_2_add_1 + nftOwnerT1_1_add_1)).eq(100);

      expect(user1_payToken_2 - user1_payToken_2_before).gt(0);
      expect(curve_sell_1 - nftOwnerT1_2_add_1 - nftOwnerT1_1_add_1 - curve_redeem_1).eq(
        user1_payToken_2 - user1_payToken_2_before,
      );

      expect(market_payToken_1 - market_payToken_2)
        .eq(user1_payToken_2 - user1_payToken_2_before + nftOwnerT1_2_add_1 + nftOwnerT1_1_add_1)
        .eq(curve_sell_1 - curve_redeem_1);

      expect(user2_payToken_2).eq(user2_payToken_2_before);

      // end
      expect(await info.market.totalSupply(paramsT1.tid)).eq(getTokenAmountWei(60000));
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
      expect((await info.mortgageNFT.info(2)).amount).eq(getTokenAmountWei(20000));
      expect((await info.mortgageNFT.info(3)).amount).eq(getTokenAmountWei(30000));
      expect((await info.mortgageNFT.info(4)).amount).eq(getTokenAmountWei(40000));
      expect((await info.mortgageNFT.info(5)).amount).eq(getTokenAmountWei(15000));
      expect((await info.mortgageNFT.info(6)).amount).eq(getTokenAmountWei(25000));
      expect((await info.mortgageNFT.info(7)).amount).eq(getTokenAmountWei(35000));
      expect((await info.mortgageNFT.info(8)).amount).eq(getTokenAmountWei(45000));

      let payToken_add =
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(60000))) +
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(150000)));
      let payToken_remove =
        (await info.market.getPayTokenAmount(0, getTokenAmountWei(20000))) +
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
