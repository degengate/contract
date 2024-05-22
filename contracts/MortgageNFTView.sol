// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";

import "./interfaces/INFTView.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/IMortgageNFT.sol";
import "./interfaces/INFTClaim.sol";

contract MortgageNFTView is INFTView {
  struct Info {
    string tid;
    string tName;
    string cid;
    string cName;
    uint256 followers;
    uint256 omf;
    uint256 timestamp;
    bool isClaim;
    uint256 amount;
  }

  address public immutable foundry;
  uint256 public immutable appId;
  address public immutable mortgageNFT;
  address public immutable nftClaim;

  constructor(address _foundry, uint256 _appId, address _mortgageNFT, address _nftClaim) {
    foundry = _foundry;
    appId = _appId;
    mortgageNFT = _mortgageNFT;
    nftClaim = _nftClaim;
  }

  function name() external pure override returns (string memory) {
    return "Castle Option";
  }

  function symbol() external pure override returns (string memory) {
    return "CO";
  }

  function tokenURI(uint256 tokenId) external view override returns (string memory) {
    Info memory info = _getInfo(tokenId);
    string[5] memory parts;

    parts[
      0
    ] = '<svg width="528" height="527" viewBox="0 0 528 527" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="528" height="527" fill="#1E1E1E"></rect><rect width="527.5" height="526.595" fill="#0F172A"></rect><rect x="25" y="24" width="479.5" height="478.682" rx="16" fill="#1E293B"></rect><rect x="37.5" y="209.5" width="452" height="99" rx="15.5" stroke="#A3E635"></rect><text fill="#E5E5E5" style="white-space: pre" font-family="Courier New" font-size="32" font-weight="bold" letter-spacing="-0.011em"><tspan x="37.78" y="161.551">@';
    parts[1] = info.tName;
    parts[
      2
    ] = '</tspan></text><text fill="#38BDF8" style="white-space: pre" font-family="Courier New" font-size="24" font-weight="bold" letter-spacing="-0.011em"><tspan x="61" y="247.387">Collateral Locked</tspan></text><text fill="#A3E635" style="white-space: pre" font-family="Courier New" font-size="32" font-weight="bold" letter-spacing="-0.011em"><tspan x="62" y="285.516">';
    parts[3] = _getShowAmount(info.amount);
    parts[
      4
    ] = '</tspan></text><path d="M 44.968 86.946 Q 43.336 86.946 41.92 86.418 Q 40.504 85.89 39.592 84.33 Q 38.68 82.77 38.68 79.65 L 38.68 64.098 Q 38.68 61.602 39.664 60.21 Q 40.648 58.818 42.424 58.266 Q 44.2 57.714 46.552 57.714 Q 48.904 57.714 50.704 58.266 Q 52.504 58.818 53.536 60.21 Q 54.568 61.602 54.568 64.098 L 54.568 68.082 L 49.144 68.082 L 49.144 63.81 Q 49.144 62.658 48.832 62.058 Q 48.52 61.458 47.992 61.266 Q 47.464 61.074 46.696 61.074 Q 45.976 61.074 45.424 61.266 Q 44.872 61.458 44.56 62.058 Q 44.248 62.658 44.248 63.81 L 44.248 80.994 Q 44.248 82.098 44.56 82.698 Q 44.872 83.298 45.424 83.514 Q 45.976 83.73 46.696 83.73 Q 47.8 83.73 48.472 83.058 Q 49.144 82.386 49.144 80.994 L 49.144 75.33 L 46.84 75.33 L 46.84 72.162 L 54.568 72.162 L 54.568 86.418 L 50.392 86.418 L 50.104 84.21 Q 50.008 84.354 49.912 84.498 Q 49.816 84.642 49.768 84.738 Q 49.288 85.554 48.16 86.25 Q 47.032 86.946 44.968 86.946 Z M 76.64 86.418 L 81.728 58.05 L 89.696 58.05 L 94.688 86.418 L 88.448 86.418 L 87.584 81.186 L 83.456 81.186 L 82.64 86.418 Z M 83.552 78.402 L 87.536 78.402 L 85.568 62.994 Z M 118.642 86.418 L 118.642 61.986 L 114.226 61.986 L 114.226 58.05 L 128.626 58.05 L 128.626 61.986 L 124.21 61.986 L 124.21 86.418 Z M 151.233 86.418 L 151.233 58.05 L 164.289 58.05 L 164.289 61.986 L 157.041 61.986 L 157.041 69.57 L 163.185 69.57 L 163.185 73.938 L 157.041 73.938 L 157.041 82.578 L 164.289 82.578 L 164.289 86.418 Z" style="fill: rgb(56, 189, 248);"></path><path d="M218.355 39H264.793V105.036H257.976V74.787H257.909C257.156 66.427 250.13 59.8757 241.574 59.8757C233.018 59.8757 225.992 66.427 225.238 74.787H225.172V105.036H218.355V39Z" fill="#8B5CF6"></path><path d="M206 48.3728L208.769 57.7456H211.112V95.6627C209.936 95.6627 208.982 96.6164 208.982 97.7929V100.349H208.556C207.38 100.349 206.426 101.303 206.426 102.479V105.036H230.284V102.479C230.284 101.303 229.33 100.349 228.154 100.349H227.728V97.7929C227.728 96.6164 226.774 95.6627 225.598 95.6627H223.041V48.3728H206Z" fill="#8B5CF6"></path><path d="M258.402 95.6627C257.226 95.6627 256.272 96.6164 256.272 97.7929V100.349H255.846C254.67 100.349 253.716 101.303 253.716 102.479V105.036H277.574V102.479C277.574 101.303 276.62 100.349 275.444 100.349H275.018V97.7929C275.018 96.6164 274.064 95.6627 272.888 95.6627V57.7456H275.231L278 48.3728H260.959V95.6627H258.402Z" fill="#8B5CF6"></path><g clip-path="url(#clip0_0_1)"><path fill-rule="evenodd" clip-rule="evenodd" d="M233.486 84.5722L233.583 86.3434C233.589 86.464 233.634 86.5775 233.709 86.6705C234.237 87.3161 236.606 89.5689 241.944 89.5689C247.281 89.5689 249.621 87.3452 250.169 86.6825C250.251 86.5825 250.299 86.4583 250.307 86.3277L250.402 84.5735C251.038 84.2215 251.694 83.8238 251.694 83.8238C252.725 83.2597 253.876 84.07 253.878 85.2585C253.882 87.1813 252.393 89.1574 250.386 90.4027C248.122 91.8068 244.743 92.3894 241.945 92.3894C239.147 92.3894 235.768 91.8068 233.504 90.4027C231.497 89.1574 230.008 87.182 230.012 85.2585C230.014 84.07 231.165 83.2597 232.196 83.8238C232.196 83.8238 232.851 84.2205 233.486 84.5722Z" fill="#8B5CF6"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M241.944 72.0034C246.308 72.0034 247.492 72.1063 249.266 72.3121H249.265C250.083 72.4071 250.739 73.0216 250.678 73.8539L250.025 82.8427C249.82 82.9025 249.597 82.9781 249.347 83.0628C248.036 83.507 245.98 84.2033 241.944 84.2033C237.908 84.2033 235.853 83.507 234.542 83.0628C234.291 82.978 234.068 82.9023 233.863 82.8425L233.21 73.8539C233.149 73.0216 233.803 72.3922 234.622 72.3121C236.375 72.1404 238.2 72.0034 241.944 72.0034ZM234.176 87.1496L234.179 87.1812L234.224 87.1917C234.208 87.1775 234.192 87.1635 234.176 87.1496ZM249.668 87.1907L249.709 87.1812L249.711 87.1525C249.697 87.1651 249.683 87.1778 249.668 87.1907Z" fill="#8B5CF6"></path></g><path d="M 320.954 86.418 L 320.954 58.05 L 330.89 58.05 Q 332.906 58.05 334.226 58.626 Q 335.546 59.202 336.194 60.378 Q 336.842 61.554 336.842 63.33 L 336.842 80.322 Q 336.842 82.674 336.026 84.018 Q 335.21 85.362 333.698 85.89 Q 332.186 86.418 330.122 86.418 Z M 326.762 83.538 L 329.21 83.538 Q 330.17 83.538 330.722 82.962 Q 331.274 82.386 331.274 80.802 L 331.274 63.954 Q 331.274 62.37 330.722 61.794 Q 330.17 61.218 329.21 61.218 L 326.762 61.218 Z M 360.693 86.418 L 360.693 58.05 L 373.749 58.05 L 373.749 61.986 L 366.501 61.986 L 366.501 69.57 L 372.645 69.57 L 372.645 73.938 L 366.501 73.938 L 366.501 82.578 L 373.749 82.578 L 373.749 86.418 Z M 402.837 86.946 Q 401.205 86.946 399.789 86.418 Q 398.373 85.89 397.461 84.33 Q 396.549 82.77 396.549 79.65 L 396.549 64.098 Q 396.549 61.602 397.533 60.21 Q 398.517 58.818 400.293 58.266 Q 402.069 57.714 404.421 57.714 Q 406.773 57.714 408.573 58.266 Q 410.373 58.818 411.405 60.21 Q 412.437 61.602 412.437 64.098 L 412.437 68.082 L 407.013 68.082 L 407.013 63.81 Q 407.013 62.658 406.701 62.058 Q 406.389 61.458 405.861 61.266 Q 405.333 61.074 404.565 61.074 Q 403.845 61.074 403.293 61.266 Q 402.741 61.458 402.429 62.058 Q 402.117 62.658 402.117 63.81 L 402.117 80.994 Q 402.117 82.098 402.429 82.698 Q 402.741 83.298 403.293 83.514 Q 403.845 83.73 404.565 83.73 Q 405.669 83.73 406.341 83.058 Q 407.013 82.386 407.013 80.994 L 407.013 75.33 L 404.709 75.33 L 404.709 72.162 L 412.437 72.162 L 412.437 86.418 L 408.261 86.418 L 407.973 84.21 Q 407.877 84.354 407.781 84.498 Q 407.685 84.642 407.637 84.738 Q 407.157 85.554 406.029 86.25 Q 404.901 86.946 402.837 86.946 Z M 436.14 86.418 L 436.14 58.05 L 449.196 58.05 L 449.196 61.986 L 441.948 61.986 L 441.948 69.57 L 448.092 69.57 L 448.092 73.938 L 441.948 73.938 L 441.948 82.578 L 449.196 82.578 L 449.196 86.418 Z M 472.332 86.418 L 472.332 58.05 L 477.18 58.05 L 483.084 75.234 L 483.084 58.05 L 487.98 58.05 L 487.98 86.418 L 483.132 86.418 L 477.228 70.386 L 477.228 86.418 Z" style="fill: rgb(56, 189, 248);"></path><defs><clipPath id="clip0_0_1"><rect width="23.88" height="20.41" fill="white" transform="translate(230 72)"></rect></clipPath></defs></svg>';

    string memory partsOutput = string(abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4]));

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "',
            _name(tokenId),
            '", "description": "',
            _desc(),
            '", "image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(partsOutput)),
            '"}'
          )
        )
      )
    );
    return string(abi.encodePacked("data:application/json;base64,", json));
  }

  function _getShowAmount(uint256 amount) private pure returns (string memory) {
    uint256 _int = amount / (10 ** 18);
    return Strings.toString(_int);
  }

  function _getInfo(uint256 tokenId) private view returns (Info memory info) {
    (info.tid, info.amount) = IMortgageNFT(mortgageNFT).info(tokenId);
    bytes memory data = IFoundry(foundry).tokenData(appId, info.tid);
    (info.tName, info.cid, info.cName, info.followers, info.omf, info.timestamp) = abi.decode(
      data,
      (string, string, string, uint256, uint256, uint256)
    );
    info.isClaim = INFTClaim(nftClaim).isClaim(info.tid);
  }

  function _name(uint256 tokenId) private view returns (string memory) {
    Info memory info = _getInfo(tokenId);
    return
      string(abi.encodePacked("@", info.tName, " - #", Strings.toString(tokenId), " - ", _getShowAmount(info.amount)));
  }

  function _desc() private pure returns (string memory) {
    return
      string(
        abi.encodePacked(
          "This NFT represents a collateral option within the Gate of Degen.\\n",
          unicode"⚠️ DISCLAIMER: Always perform due diligence before purchasing this NFT. Verify that the image reflects the correct number of option in the collateral. Refresh cached images on trading platforms to ensure you have the latest data."
        )
      );
  }
}
