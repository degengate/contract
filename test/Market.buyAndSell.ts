import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { getTokenAmountWei } from "./shared/utils";

describe("Market", function () {
  describe("buyAndSell", function () {
    let data = [
      {
        expectNeedPayToken: BigInt("1010000101000010100"), // 1.01
        buyAmount: 1,
      },
      {
        expectNeedPayToken: BigInt("10100010100010100010"), // 10.1
        buyAmount: 10,
      },
      {
        expectNeedPayToken: BigInt("101001010010100101001"), // 101
        buyAmount: 100,
      },
      {
        expectNeedPayToken: BigInt("1010101010101010101010"), // 1010.1
        buyAmount: 1000,
      },
      {
        expectNeedPayToken: BigInt("10110110110110110110110"), // 10110.1
        buyAmount: 10000,
      },
      {
        expectNeedPayToken: BigInt("102020202020202020202019"), // 102,020.20
        buyAmount: 100000,
      },
      {
        expectNeedPayToken: BigInt("531578947368421052631577"), // 531,578
        buyAmount: 500000,
      },
      {
        expectNeedPayToken: BigInt("1122222222222222222222221"), // 1,122,222
        buyAmount: 1000000,
      },
      {
        expectNeedPayToken: BigInt("2525000000000000000000000"), // 2,525,000
        buyAmount: 2000000,
      },
      {
        expectNeedPayToken: BigInt("4328571428571428571428570"), // 4,328,571
        buyAmount: 3000000,
      },
      {
        expectNeedPayToken: BigInt("6733333333333333333333332"), // 6,733,333
        buyAmount: 4000000,
      },
      {
        expectNeedPayToken: BigInt("10100000000000000000000000"), // 10,100,000
        buyAmount: 5000000,
      },
      {
        expectNeedPayToken: BigInt("15150000000000000000000000"), // 15,150,000
        buyAmount: 6000000,
      },
      {
        expectNeedPayToken: BigInt("23566666666666666666666665"), // 23,566,666
        buyAmount: 7000000,
      },
      {
        expectNeedPayToken: BigInt("40400000000000000000000000"), // 40,400,000
        buyAmount: 8000000,
      },
      {
        expectNeedPayToken: BigInt("90900000000000000000000000"), // 90,900,000
        buyAmount: 9000000,
      },
      {
        expectNeedPayToken: BigInt("10099989900000000000000000000000"),
        buyAmount: 9999990,
      },
      {
        expectNeedPayToken: BigInt("11222212122222222222222222222221"),
        buyAmount: 9999991,
      },
      {
        expectNeedPayToken: BigInt("50499989900000000000000000000000"),
        buyAmount: 9999998,
      },
    ];

    it("buy revert", async function () {
      const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

      let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwner2 = info.wallets[info.nextWalletIndex + 2];

      let params = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwner1.address,
        onftOwner: nftOwner2.address,
      };
      await info.appOperator
        .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

      // not tid
      await expect(
        info.market.buy("t2222", getTokenAmountWei(1000)),
      ).revertedWith("TE");
      // approve < need
      await info.simpleToken.approve(await info.market.getAddress(), 1)
      await expect(
        info.market.buy(params.tid, getTokenAmountWei(1000)),
      ).revertedWith("ERC20: insufficient allowance");
      // buy amount > 1000W
      await info.simpleToken.approve(await info.market.getAddress(), BigInt(10) ** BigInt(18) * BigInt("10000000000"))
      await expect(
        info.market.buy(params.tid, getTokenAmountWei(10000000))
      ).revertedWithPanic("0x12");
      // buy amount = 10000W
      await expect(
        info.market.buy(params.tid, getTokenAmountWei(100000000))
      ).revertedWithPanic("0x11");
      // buy 0
      await expect(info.market.buy(params.tid, 0)).revertedWith("TAE");
    });

    it("sell revert", async function () {
      const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

      let nftOwnerT1U1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT1U2 = info.wallets[info.nextWalletIndex + 2];
      let nftOwnerT2U1 = info.wallets[info.nextWalletIndex + 3];
      let nftOwnerT2U2 = info.wallets[info.nextWalletIndex + 4];
      let user1 = info.wallets[info.nextWalletIndex + 5];
      let user2 = info.wallets[info.nextWalletIndex + 6];
      let user3 = info.wallets[info.nextWalletIndex + 7];

      let paramsT1 = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwnerT1U1.address,
        onftOwner: nftOwnerT1U2.address,
      };
      await info.appOperator
        .createToken(paramsT1.tid, paramsT1.tData, paramsT1.cnftOwner, paramsT1.onftOwner);

      let paramsT2 = {
        tid: "t2",
        tData: "0x22",
        cnftOwner: nftOwnerT2U1.address,
        onftOwner: nftOwnerT2U2.address,
      };
      await info.appOperator
        .createToken(paramsT2.tid, paramsT2.tData, paramsT2.cnftOwner, paramsT2.onftOwner);

      // not tid
      await expect(info.market.sell("t123", getTokenAmountWei(1000))).revertedWith("TE");

      // totalSupply not have, test: user1 sell t1 1
      await expect(info.market.connect(user1).sell(paramsT1.tid, getTokenAmountWei(1))).revertedWith("TAE");

      // user1 buy t1 1000
      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(22))
      await info.simpleToken.transfer(user2.address, BigInt(10) ** BigInt(22))
      await info.simpleToken.connect(user1).approve(await info.market.getAddress(), MAX_UINT256)
      await info.simpleToken.connect(user2).approve(await info.market.getAddress(), MAX_UINT256)
      await info.market
        .connect(user1)
        .buy(paramsT1.tid, getTokenAmountWei(1000));
      // user2 buy t1 and t2 1000
      await info.market
        .connect(user2)
        .buy(paramsT1.tid, getTokenAmountWei(1000));
      await info.market
        .connect(user2)
        .buy(paramsT2.tid, getTokenAmountWei(1000));

      // user not have, test: user1 sell t2 1
      await expect(info.market.connect(user1).sell(paramsT2.tid, getTokenAmountWei(1))).revertedWith("TAE");

      // user not enough, test: user1 sell t1 1001
      await expect(info.market.connect(user1).sell(paramsT1.tid, getTokenAmountWei(1001))).revertedWith("TAE");

      // totalSupply not enough, test: user3 sell t1 1001
      await expect(info.market.connect(user3).sell(paramsT1.tid, getTokenAmountWei(1001))).revertedWith("TAE");

      // sell 0
      await expect(info.market.connect(user1).sell(paramsT1.tid, 0)).revertedWith("TAE");
    });

    it("buy refund result and sell result", async function () {
      const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

      let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];

      let params = {
        tid: "t1",
        tData: "0x11",
        cnftOwner: nftOwner1.address,
        onftOwner: nftOwner2.address,
      };
      await info.appOperator
        .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

      let buyAmount = getTokenAmountWei(1000);

      await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(18) * BigInt("10000000000"));
      await info.simpleToken.connect(user1).approve(await info.market.getAddress(), BigInt(10) ** BigInt(18) * BigInt("10000000000"))
      let needPayToken = await info.market.connect(user1).buy.staticCall(params.tid, buyAmount);

      let user1PayToken1 = await info.simpleToken.balanceOf(user1.address)

      await info.market.connect(user1).buy(params.tid, buyAmount);

      let user1PayToken2 = await info.simpleToken.balanceOf(user1.address)

      expect(user1PayToken2).eq(user1PayToken1 - needPayToken);

      let userGetPayToken = await info.market.connect(user1).sell.staticCall(params.tid, buyAmount);
      await info.market.connect(user1).sell(params.tid, buyAmount);

      let user1PayToken3 = await info.simpleToken.balanceOf(user1.address)

      expect(user1PayToken3).eq(user1PayToken2 + userGetPayToken);
    });

    it("buy one", async function () {
      for (let i = 0; i < data.length; i++) {
        const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let buyAmount = BigInt(10) ** BigInt(18) * BigInt(data[i].buyAmount);
        let expectNeedPayToken = data[i].expectNeedPayToken;

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(40))
        await info.simpleToken.connect(user1).approve(await info.market.getAddress(), MAX_UINT256)
        let needPayToken = await info.market.connect(user1).buy.staticCall(params.tid, buyAmount);

        let user1PayToken1 = await info.simpleToken.balanceOf(user1.address)
        let marketPayToken1 = await info.simpleToken.balanceOf(await info.market.getAddress())
        let nftOwner1PayToken1 = await info.simpleToken.balanceOf(nftOwner1.address)
        let nftOwner2PayToken1 = await info.simpleToken.balanceOf(nftOwner2.address)

        await info.market.connect(user1).buy(params.tid, buyAmount);

        let curvePayToken = await info.market.getPayTokenAmount(0, buyAmount);

        let user1PayToken2 = await info.simpleToken.balanceOf(user1.address)
        let marketPayToken2 = await info.simpleToken.balanceOf(await info.market.getAddress())
        let nftOwner1PayToken2 = await info.simpleToken.balanceOf(nftOwner1.address)
        let nftOwner2PayToken2 = await info.simpleToken.balanceOf(nftOwner2.address)

        let nftOwner1AddPayToken = nftOwner1PayToken2 - nftOwner1PayToken1;
        let nftOwner2AddPayToken = nftOwner2PayToken2 - nftOwner2PayToken1;

        expect(needPayToken).eq(expectNeedPayToken);

        expect(await info.market.totalSupply(params.tid)).eq(buyAmount);
        expect(await info.market.balanceOf(params.tid, user1.address)).eq(buyAmount);
        expect(await info.market.balanceOf(params.tid, await info.market.getAddress())).eq(0);
        expect(await info.market.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.market.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(user1PayToken2).eq(user1PayToken1 - needPayToken);
        expect(marketPayToken2 - marketPayToken1).eq(curvePayToken);
        expect(curvePayToken + nftOwner1AddPayToken + nftOwner2AddPayToken).eq(needPayToken);

        expect(nftOwner2AddPayToken / nftOwner1AddPayToken).eq(19);
        expect(curvePayToken / (nftOwner1AddPayToken + nftOwner2AddPayToken)).eq(100);
      }
    });

    it("buy one and sell one", async function () {
      for (let i = 0; i < data.length; i++) {
        const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

        let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwner2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let buyAmount = getTokenAmountWei(data[i].buyAmount);
        let expectNeedPayToken = data[i].expectNeedPayToken;

        let params = {
          tid: "t1",
          tData: "0x11",
          cnftOwner: nftOwner1.address,
          onftOwner: nftOwner2.address,
        };
        await info.appOperator
          .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

        await info.simpleToken.transfer(user1.address, BigInt(10) ** BigInt(40))
        await info.simpleToken.connect(user1).approve(await info.market.getAddress(), MAX_UINT256)
        let needPayToken = await info.market.connect(user1).buy.staticCall(params.tid, buyAmount);

        let user1PayToken1 = await info.simpleToken.balanceOf(user1.address)
        let marketPayToken1 = await info.simpleToken.balanceOf(await info.market.getAddress())
        let nftOwner1PayToken1 = await info.simpleToken.balanceOf(nftOwner1.address)
        let nftOwner2PayToken1 = await info.simpleToken.balanceOf(nftOwner2.address)

        await info.market.connect(user1).buy(params.tid, buyAmount);

        let curvePayToken = await info.market.getPayTokenAmount(0, buyAmount);

        let user1PayToken2 = await info.simpleToken.balanceOf(user1.address)
        let marketPayToken2 = await info.simpleToken.balanceOf(await info.market.getAddress())
        let nftOwner1PayToken2 = await info.simpleToken.balanceOf(nftOwner1.address)
        let nftOwner2PayToken2 = await info.simpleToken.balanceOf(nftOwner2.address)

        let nftOwner1AddPayToken = nftOwner1PayToken2 - nftOwner1PayToken1;
        let nftOwner2AddPayToken = nftOwner2PayToken2 - nftOwner2PayToken1;

        expect(needPayToken).eq(expectNeedPayToken);

        expect(await info.market.totalSupply(params.tid)).eq(buyAmount);
        expect(await info.market.balanceOf(params.tid, user1.address)).eq(buyAmount);
        expect(await info.market.balanceOf(params.tid, await info.market.getAddress())).eq(0);
        expect(await info.market.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.market.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(user1PayToken2).eq(user1PayToken1 - needPayToken);
        expect(marketPayToken2 - marketPayToken1).eq(curvePayToken);
        expect(curvePayToken + nftOwner1AddPayToken + nftOwner2AddPayToken).eq(needPayToken);

        expect(nftOwner2AddPayToken / nftOwner1AddPayToken).eq(19);
        expect(curvePayToken / (nftOwner1AddPayToken + nftOwner2AddPayToken)).eq(100);

        // sell
        await info.market.connect(user1).sell(params.tid, buyAmount);

        let user1PayTokenSell1 = await info.simpleToken.balanceOf(user1.address)
        let marketPayTokenSell1 = await info.simpleToken.balanceOf(await info.market.getAddress())
        let nftOwner1PayTokenSell1 = await info.simpleToken.balanceOf(nftOwner1.address)
        let nftOwner2PayTokenSell1 = await info.simpleToken.balanceOf(nftOwner2.address)

        let nftOwner1AddPayToken2 = nftOwner1PayTokenSell1 - nftOwner1PayToken2;
        let nftOwner2AddPayToken2 = nftOwner2PayTokenSell1 - nftOwner2PayToken2;
        let user1PayTokenSellAdd = user1PayTokenSell1 - user1PayToken2;

        expect(await info.market.totalSupply(params.tid)).eq(0);
        expect(await info.market.balanceOf(params.tid, user1.address)).eq(0);
        expect(await info.market.balanceOf(params.tid, await info.market.getAddress())).eq(0);
        expect(await info.market.balanceOf(params.tid, nftOwner1.address)).eq(0);
        expect(await info.market.balanceOf(params.tid, nftOwner2.address)).eq(0);

        expect(nftOwner2AddPayToken2 / nftOwner1AddPayToken2).eq(19);
        expect(user1PayTokenSellAdd / (nftOwner1AddPayToken2 + nftOwner2AddPayToken2)).eq(99);
        expect(marketPayTokenSell1).eq(0);
        expect(marketPayToken2).eq(user1PayTokenSellAdd + nftOwner1AddPayToken2 + nftOwner2AddPayToken2);
      }
    });
  });
});
