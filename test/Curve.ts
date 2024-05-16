import { deployAllContract } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import Decimal from "decimal.js";
import { Curve } from "../typechain-types";

const getWei = function (
  count: number,
) {
  return BigInt(10) ** BigInt(18) * BigInt(count)
}

const expectCurve = async function (
  curve: Curve,
  count: bigint,
  amountStr: string,
  priceStr: string,
  mcapStr: string,
  feeStr: string,
) {
  let wei = (BigInt(10) ** BigInt(18)).toString();

  let mcap = await curve.curveMath(0, count);
  let fee = new Decimal(mcap.toString()).dividedBy(100);
  let amount = new Decimal(mcap.toString()).add(fee).dividedBy(wei).toFixed(3);

  // 10**50 / ((10**25 - x)**2)
  let a = BigInt(10) ** BigInt(50);
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
    const info = await loadFixture(deployAllContract);

    const max = BigInt(10) ** BigInt(18) * BigInt(10000000); // 1000 W

    expect(await info.curve.curveMath(0, 1)).eq(1);
    expect(await info.curve.curveMath(0, 999)).eq(999);
    expect(await info.curve.curveMath(0, 1000)).eq(1000);

    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18))).eq("1000000100000010000"); // 1
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(10))).eq("10000010000010000010"); // 10
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(100))).eq("100001000010000100001"); // 100
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(1000))).eq("1000100010001000100010"); // 1,000
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(10000))).eq("10010010010010010010010"); // 10,010
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(100000))).eq("101010101010101010101010"); // 101,010
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(1000000))).eq("1111111111111111111111111"); // 1,111,111
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(5000000))).eq("10000000000000000000000000"); // 10,000,000
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(6000000))).eq("15000000000000000000000000"); // 15,000,000
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(7000000))).eq("23333333333333333333333333"); // 23,333,333
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(8000000))).eq("40000000000000000000000000"); // 40,000,000
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(9000000))).eq("90000000000000000000000000"); // 90,000,000
    expect(await info.curve.curveMath(0, BigInt(10) ** BigInt(18) * BigInt(9999990))).eq("9999990000000000000000000000000");  // 9,999,990,000,000

    expect(await info.curve.curveMath(0, max - BigInt(1))).eq(BigInt("99999999999999999999999990000000000000000000000000"));
    await expect(info.curve.curveMath(0, max)).revertedWithPanic("0x12");
    await expect(info.curve.curveMath(1, max - BigInt(1))).revertedWithPanic("0x12");

    expect(await info.curve.curveMath(0, max - BigInt(1))).eq(
      (await info.curve.curveMath(0, 1)) + (await info.curve.curveMath(1, max - BigInt(2))),
    );

    expect(await info.curve.curveMath(0, getWei(10000))).eq(
      (await info.curve.curveMath(0, getWei(1000))) +
      (await info.curve.curveMath(getWei(1000), getWei(2000))) +
      (await info.curve.curveMath(getWei(3000), getWei(3000))) +
      (await info.curve.curveMath(getWei(6000), getWei(4000))),
    );
  });


  it("curve", async function () {
    const info = await loadFixture(deployAllContract);

    let data = [
      {
        count: 1,
        amount: "1.010",
        price: "1.0000002",
        mcap: "1.000",
        fee: "0.010",
      },
      {
        count: 40,
        amount: "40.400",
        price: "1.0000080",
        mcap: "40.000",
        fee: "0.400",
      },
      {
        count: 50,
        amount: "50.500",
        price: "1.0000100",
        mcap: "50.000",
        fee: "0.500",
      },
      {
        count: 100,
        amount: "101.001",
        price: "1.0000200",
        mcap: "100.001",
        fee: "1.000",
      },
      {
        count: 200,
        amount: "202.004",
        price: "1.0000400",
        mcap: "200.004",
        fee: "2.000",
      },
      {
        count: 1000,
        amount: "1010.101",
        price: "1.0002000",
        mcap: "1000.100",
        fee: "10.001",
      },
      {
        count: 3000,
        amount: "3030.909",
        price: "1.0006003",
        mcap: "3000.900",
        fee: "30.009",
      },
      {
        count: 10000,
        amount: "10110.110",
        price: "1.0020030",
        mcap: "10010.010",
        fee: "100.100",
      },
      {
        count: 20000,
        amount: "20240.481",
        price: "1.0040120",
        mcap: "20040.080",
        fee: "200.401",
      },
      {
        count: 100000,
        amount: "102020.202",
        price: "1.0203041",
        mcap: "101010.101",
        fee: "1010.101",
      },
      {
        count: 200000,
        amount: "206122.449",
        price: "1.0412328",
        mcap: "204081.633",
        fee: "2040.816",
      },
      {
        count: 500000,
        amount: "531578.947",
        price: "1.1080332",
        mcap: "526315.789",
        fee: "5263.158",
      },
      {
        count: 1000000,
        amount: "1122222.222",
        price: "1.2345679",
        mcap: "1111111.111",
        fee: "11111.111",
      },
      {
        count: 2000000,
        amount: "2525000.000",
        price: "1.5625000",
        mcap: "2500000.000",
        fee: "25000.000",
      },
      {
        count: 3000000,
        amount: "4328571.429",
        price: "2.0408163",
        mcap: "4285714.286",
        fee: "42857.143",
      },
      {
        count: 4000000,
        amount: "6733333.333",
        price: "2.7777778",
        mcap: "6666666.667",
        fee: "66666.667",
      },
      {
        count: 5000000,
        amount: "10100000.000",
        price: "4.0000000",
        mcap: "10000000.000",
        fee: "100000.000",
      },
      {
        count: 6000000,
        amount: "15150000.000",
        price: "6.2500000",
        mcap: "15000000.000",
        fee: "150000.000",
      },
      {
        count: 7000000,
        amount: "23566666.667",
        price: "11.1111111",
        mcap: "23333333.333",
        fee: "233333.333",
      },
      {
        count: 8000000,
        amount: "40400000.000",
        price: "25.0000000",
        mcap: "40000000.000",
        fee: "400000.000",
      },
      {
        count: 9000000,
        amount: "90900000.000",
        price: "100.0000000",
        mcap: "90000000.000",
        fee: "900000.000",
      },
      {
        count: 9999990,
        amount: "10099989900000.000",
        price: "1000000000000.0000000",
        mcap: "9999990000000.000",
        fee: "99999900000.000",
      },
      {
        count: 9999997,
        amount: "33666656566666.667",
        price: "11111111111111.1111110",
        mcap: "33333323333333.333",
        fee: "333333233333.333",
      },
      {
        count: 9999998,
        amount: "50499989900000.000",
        price: "25000000000000.0000000",
        mcap: "49999990000000.000",
        fee: "499999900000.000",
      },
      {
        count: 9999999,
        amount: "100999989900000.000",
        price: "100000000000000.0000000",
        mcap: "99999990000000.000",
        fee: "999999900000.000",
      },
    ];
    for (let i = 0; i < data.length; i++) {
      await expectCurve(
        info.curve,
        BigInt(10) ** BigInt(18) * BigInt(data[i].count),
        data[i].amount,
        data[i].price,
        data[i].mcap,
        data[i].fee,
      );
    }
  });
});
