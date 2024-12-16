import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { CPFCurve } from "../typechain-types";

import { ethers } from "hardhat";

const getWei = function (
  count: number,
) {
  return BigInt(10) ** BigInt(18) * BigInt(count)
}

describe("XMeme.Curve", function () {
  it("curveMath max 100W", async function () {
    const info = (await loadFixture(deployAllContracts));

    const max = BigInt(10) ** BigInt(18 + 6); // 100 W
    let curve = info.xMemeAllContractInfo.curve;

    let cPFCurve: CPFCurve = (await ethers.getContractAt("CPFCurve", await curve.getAddress())) as CPFCurve;

    expect(await cPFCurve.lpProduct()).eq(BigInt(10) ** BigInt(20))
    expect(await cPFCurve.lpRatio()).eq(BigInt(10) ** BigInt(24))

    expect(await curve.curveMath(0, 1)).eq(0);
    expect(await curve.curveMath(0, 1000)).eq(0);
    expect(await curve.curveMath(0, 10000)).eq(1);
    expect(await curve.curveMath(0, 100000)).eq(10);
    expect(await curve.curveMath(0, BigInt(10) ** BigInt(18))).eq(100000100000100); // 0.0001

    expect(await curve.curveMath(0, max - BigInt(1))).eq(BigInt("99999999999999999999999900000000000000000000"));
    await expect(curve.curveMath(0, max)).revertedWithPanic("0x12");
    await expect(curve.curveMath(1, max - BigInt(1))).revertedWithPanic("0x12");

    expect(await curve.curveMath(0, max - BigInt(1))).eq(
      (await curve.curveMath(0, 1)) + (await curve.curveMath(1, max - BigInt(2))),
    );

    expect(await curve.curveMath(0, getWei(10000))).eq(
      (await curve.curveMath(0, getWei(1000))) +
      (await curve.curveMath(getWei(1000), getWei(2000))) +
      (await curve.curveMath(getWei(3000), getWei(3000))) +
      (await curve.curveMath(getWei(6000), getWei(4000))),
    );
  });


});
