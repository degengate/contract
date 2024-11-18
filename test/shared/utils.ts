import Decimal from "decimal.js";
import * as fs from "fs";

export const getTokenAmountWei = (count: number | bigint): bigint => {
  return BigInt(10) ** BigInt(18) * BigInt(count);
};

export const getTokenAmountWeiFromDecimal = (count: string): bigint => {
  let wei = BigInt(10) ** BigInt(18);
  return BigInt(new Decimal(count).times(wei.toString()).toFixed(0));
};

export const parseTokenURI = (content: any) => {
  let str: string = content.split(",")[1];
  let buff = Buffer.from(str, "base64");
  str = buff.toString("utf8");
  const json = JSON.parse(str);

  let image = "";
  if (json.image) {
    image = Buffer.from(json.image.split(",")[1], "base64").toString("utf8");
  }

  return {
    name: json.name,
    description: json.description,
    image: image,
  };
};

export const saveSVG = (filename: any, svgStr: any) => {
  fs.writeFileSync("./tmp/" + filename + ".svg", svgStr);
};


export const parseHypeMemePublicTokenURI = (content: any) => {
  let str: string = content.split(",")[1];
  let buff = Buffer.from(str, "base64");
  str = buff.toString("utf8");
  const json = JSON.parse(str);

  return {
    name: json.name,
    description: json.description,
    image: json.image,
    metadata: {
      name: json.metadata.name,
      ticker: json.metadata.ticker,
      image: json.metadata.image,
      percent: json.metadata.percent,
    }
  };
};

export const parseHypeMemeMortgageTokenURI = (content: any) => {
  let str: string = content.split(",")[1];
  let buff = Buffer.from(str, "base64");
  str = buff.toString("utf8");
  const json = JSON.parse(str);

  return {
    name: json.name,
    description: json.description,
    image: json.image,
    metadata: {
      name: json.metadata.name,
      ticker: json.metadata.ticker,
      image: json.metadata.image,
      amount: json.metadata.amount,
    }
  };
};