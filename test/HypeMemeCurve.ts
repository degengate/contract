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
  let fee = new Decimal(mcap.toString()).dividedBy(100);
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

describe("Curve", function () {
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
        amount: "0.101",
        price: "0.1000000",
        mcap: "0.100",
        fee: "0.001",
      },
      {
        count: 40,
        amount: "4.040",
        price: "0.1000008",
        mcap: "4.000",
        fee: "0.040",
      },
      {
        count: 50,
        amount: "5.050",
        price: "0.1000010",
        mcap: "5.000",
        fee: "0.050",
      },
      {
        count: 100,
        amount: "10.100",
        price: "0.1000020",
        mcap: "10.000",
        fee: "0.100",
      },
      {
        count: 200,
        amount: "20.200",
        price: "0.1000040",
        mcap: "20.000",
        fee: "0.200",
      },
      {
        count: 1000,
        amount: "101.010",
        price: "0.1000200",
        mcap: "100.010",
        fee: "1.000",
      },
      {
        count: 3000,
        amount: "303.091",
        price: "0.1000600",
        mcap: "300.090",
        fee: "3.001",
      },
      {
        count: 10000,
        amount: "1011.011",
        price: "0.1002003",
        mcap: "1001.001",
        fee: "10.010",
      },
      {
        count: 20000,
        amount: "2024.048",
        price: "0.1004012",
        mcap: "2004.008",
        fee: "20.040",
      },
      {
        count: 100000,
        amount: "10202.020",
        price: "0.1020304",
        mcap: "10101.010",
        fee: "101.010",
      },
      {
        count: 200000,
        amount: "20612.245",
        price: "0.1041233",
        mcap: "20408.163",
        fee: "204.082",
      },
      {
        count: 500000,
        amount: "53157.895",
        price: "0.1108033",
        mcap: "52631.579",
        fee: "526.316",
      },
      {
        count: 1000000,
        amount: "112222.222",
        price: "0.1234568",
        mcap: "111111.111",
        fee: "1111.111",
      },
      {
        count: 2000000,
        amount: "252500.000",
        price: "0.1562500",
        mcap: "250000.000",
        fee: "2500.000",
      },
      {
        count: 3000000,
        amount: "432857.143",
        price: "0.2040816",
        mcap: "428571.429",
        fee: "4285.714",
      },
      {
        count: 4000000,
        amount: "673333.333",
        price: "0.2777778",
        mcap: "666666.667",
        fee: "6666.667",
      },
      {
        count: 5000000,
        amount: "1010000.000",
        price: "0.4000000",
        mcap: "1000000.000",
        fee: "10000.000",
      },
      {
        count: 6000000,
        amount: "1515000.000",
        price: "0.6250000",
        mcap: "1500000.000",
        fee: "15000.000",
      },
      {
        count: 7000000,
        amount: "2356666.667",
        price: "1.1111111",
        mcap: "2333333.333",
        fee: "23333.333",
      },
      {
        count: 8000000,
        amount: "4040000.000",
        price: "2.5000000",
        mcap: "4000000.000",
        fee: "40000.000",
      },
      {
        count: 9000000,
        amount: "9090000.000",
        price: "10.0000000",
        mcap: "9000000.000",
        fee: "90000.000",
      },
      {
        count: 9999990,
        amount: "1009998990000.000",
        price: "100000000000.0000000",
        mcap: "999999000000.000",
        fee: "9999990000.000",
      },
      {
        count: 9999997,
        amount: "3366665656666.667",
        price: "1111111111111.1111111",
        mcap: "3333332333333.333",
        fee: "33333323333.333",
      },
      {
        count: 9999998,
        amount: "5049998990000.000",
        price: "2500000000000.0000000",
        mcap: "4999999000000.000",
        fee: "49999990000.000",
      },
      {
        count: 9999999,
        amount: "10099998990000.000",
        price: "10000000000000.0000000",
        mcap: "9999999000000.000",
        fee: "99999990000.000",
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
