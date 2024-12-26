import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import Decimal from "decimal.js";
import { HypeMemeCurve } from "../typechain-types";

const getWei = function (
  count: number,
) {
  return BigInt(10) ** BigInt(18) * BigInt(count)
}

const expectCurve = async function (
  curve: HypeMemeCurve,
  count: bigint,
  amountStr: string,
  priceStr: string,
  mcapStr: string,
  feeStr: string,
) {
  console.log(count, amountStr, priceStr, mcapStr, feeStr)
  let wei = (BigInt(10) ** BigInt(18)).toString();

  let mcap = await curve.curveMath(0, count);
  let fee = new Decimal(mcap.toString()).times(16).dividedBy(1000);
  let amount = new Decimal(mcap.toString()).add(fee).dividedBy(wei).toFixed(3);

  // 10**49 / ((10**25 - x)**2)
  let a = BigInt(10) ** BigInt(49);
  let b = (BigInt(10) ** BigInt(25) - count) ** BigInt(2);
  let price = new Decimal(a.toString()).dividedBy(new Decimal(b.toString())).toFixed(7);

  // amount eq
  expect(amount).eq(amountStr);

  // price eq
  expect(price).eq(priceStr);

  // mcap eq
  expect(new Decimal(mcap.toString()).dividedBy(wei).toFixed(3)).eq(mcapStr);

  // fee eq
  expect(fee.dividedBy(wei).toFixed(3)).eq(feeStr);

  let countInt = BigInt(count);
  if (countInt > BigInt(10)) {
    let part1 = countInt / BigInt(4);
    let part2 = (countInt - part1) / BigInt(3);
    let part3 = countInt - part1 - part2;
    let mcap1 = await curve.curveMath(0, part1);
    let mcap2 = await curve.curveMath(part1, part2);
    let mcap3 = await curve.curveMath(part1 + part2, part3);

    expect(mcap1 + mcap2 + mcap3).eq(mcap);
  }
};

describe("HypeMemeCurve", function () {
  it("curveMath max 1000W", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;

    const max = BigInt(10) ** BigInt(18) * BigInt(10000000); // 1000 W

    expect(await info.hypeMemeCurve.curveMath(0, 1)).eq(0);
    expect(await info.hypeMemeCurve.curveMath(0, 999)).eq(99);
    expect(await info.hypeMemeCurve.curveMath(0, 1000)).eq(100);

    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18))).eq("100000010000001000"); // 0.1
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(10))).eq("1000001000001000001"); // 1
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(100))).eq("10000100001000010000"); // 10
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(1000))).eq("100010001000100010001"); // 100
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(10000))).eq("1001001001001001001001"); // 1,001
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(100000))).eq("10101010101010101010101"); // 10,101
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(1000000))).eq("111111111111111111111111"); // 111,111
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(5000000))).eq("1000000000000000000000000"); // 1,000,000
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(6000000))).eq("1500000000000000000000000"); // 1,500,000
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(7000000))).eq("2333333333333333333333333"); // 2,333,333
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(8000000))).eq("4000000000000000000000000"); // 4,000,000
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(9000000))).eq("9000000000000000000000000"); // 9,000,000
    expect(await info.hypeMemeCurve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(9999990))).eq("999999000000000000000000000000");  // 999,999,000,000

    expect(await info.hypeMemeCurve.curveMath(0, max - BigInt(1))).eq(BigInt("9999999999999999999999999000000000000000000000000"));
    await expect(info.hypeMemeCurve.curveMath(0, max)).revertedWithPanic("0x12");
    await expect(info.hypeMemeCurve.curveMath(1, max - BigInt(1))).revertedWithPanic("0x12");

    expect(await info.hypeMemeCurve.curveMath(0, max - BigInt(1))).eq(
      (await info.hypeMemeCurve.curveMath(0, 1)) + (await info.hypeMemeCurve.curveMath(1, max - BigInt(2))),
    );

    expect(await info.hypeMemeCurve.curveMath(0, getWei(10000))).eq(
      (await info.hypeMemeCurve.curveMath(0, getWei(1000))) +
      (await info.hypeMemeCurve.curveMath(getWei(1000), getWei(2000))) +
      (await info.hypeMemeCurve.curveMath(getWei(3000), getWei(3000))) +
      (await info.hypeMemeCurve.curveMath(getWei(6000), getWei(4000))),
    );
  });


  it("curve", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;

    let data = [
      {
        count: 1,
        amount: "0.102",
        price: "0.1000000",
        mcap: "0.100",
        fee: "0.002",
      },
      {
        count: 40,
        amount: "4.064",
        price: "0.1000008",
        mcap: "4.000",
        fee: "0.064",
      },
      {
        count: 50,
        amount: "5.080",
        price: "0.1000010",
        mcap: "5.000",
        fee: "0.080",
      },
      {
        count: 100,
        amount: "10.160",
        price: "0.1000020",
        mcap: "10.000",
        fee: "0.160",
      },
      {
        count: 200,
        amount: "20.320",
        price: "0.1000040",
        mcap: "20.000",
        fee: "0.320",
      },
      {
        count: 1000,
        amount: "101.610",
        price: "0.1000200",
        mcap: "100.010",
        fee: "1.600",
      },
      {
        count: 3000,
        amount: "304.891",
        price: "0.1000600",
        mcap: "300.090",
        fee: "4.801",
      },
      {
        count: 10000,
        amount: "1017.017",
        price: "0.1002003",
        mcap: "1001.001",
        fee: "16.016",
      },
      {
        count: 20000,
        amount: "2036.072",
        price: "0.1004012",
        mcap: "2004.008",
        fee: "32.064",
      },
      {
        count: 100000,
        amount: "10262.626",
        price: "0.1020304",
        mcap: "10101.010",
        fee: "161.616",
      },
      {
        count: 200000,
        amount: "20734.694",
        price: "0.1041233",
        mcap: "20408.163",
        fee: "326.531",
      },
      {
        count: 500000,
        amount: "53473.684",
        price: "0.1108033",
        mcap: "52631.579",
        fee: "842.105",
      },
      {
        count: 1000000,
        amount: "112888.889",
        price: "0.1234568",
        mcap: "111111.111",
        fee: "1777.778",
      },
      {
        count: 2000000,
        amount: "254000.000",
        price: "0.1562500",
        mcap: "250000.000",
        fee: "4000.000",
      },
      {
        count: 3000000,
        amount: "435428.571",
        price: "0.2040816",
        mcap: "428571.429",
        fee: "6857.143",
      },
      {
        count: 4000000,
        amount: "677333.333",
        price: "0.2777778",
        mcap: "666666.667",
        fee: "10666.667",
      },
      {
        count: 5000000,
        amount: "1016000.000",
        price: "0.4000000",
        mcap: "1000000.000",
        fee: "16000.000",
      },
      {
        count: 6000000,
        amount: "1524000.000",
        price: "0.6250000",
        mcap: "1500000.000",
        fee: "24000.000",
      },
      {
        count: 7000000,
        amount: "2370666.667",
        price: "1.1111111",
        mcap: "2333333.333",
        fee: "37333.333",
      },
      {
        count: 8000000,
        amount: "4064000.000",
        price: "2.5000000",
        mcap: "4000000.000",
        fee: "64000.000",
      },
      {
        count: 9000000,
        amount: "9144000.000",
        price: "10.0000000",
        mcap: "9000000.000",
        fee: "144000.000",
      },
      {
        count: 9999990,
        amount: "1015998984000.000",
        price: "100000000000.0000000",
        mcap: "999999000000.000",
        fee: "15999984000.000",
      },
      {
        count: 9999997,
        amount: "3386665650666.667",
        price: "1111111111111.1111111",
        mcap: "3333332333333.333",
        fee: "53333317333.333",
      },
      {
        count: 9999998,
        amount: "5079998984000.000",
        price: "2500000000000.0000000",
        mcap: "4999999000000.000",
        fee: "79999984000.000",
      },
      {
        count: 9999999,
        amount: "10159998984000.000",
        price: "10000000000000.0000000",
        mcap: "9999999000000.000",
        fee: "159999984000.000",
      },
    ];
    for (let i = 0; i < data.length; i++) {
      await expectCurve(
        info.hypeMemeCurve,
        BigInt(10) ** BigInt(18) * BigInt(data[i].count),
        data[i].amount,
        data[i].price,
        data[i].mcap,
        data[i].fee,
      );
    }
  });
});
