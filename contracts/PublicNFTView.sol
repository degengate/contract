// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./libraries/BokkyPooBahsDateTimeLibrary.sol";
import "base64-sol/base64.sol";

import "./interfaces/INFTView.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/IPublicNFT.sol";
import "./interfaces/INFTClaim.sol";

contract PublicNFTView is INFTView {
  struct Info {
    string tid;
    string tName;
    string cid;
    string cName;
    uint256 followers;
    uint256 omf;
    uint256 percent;
    uint256 timestamp;
    bool isClaim;
  }

  address public immutable foundry;
  uint256 public immutable appId;
  address public immutable publicNFT;
  address public immutable nftClaim;

  constructor(address _foundry, uint256 _appId, address _publicNFT, address _nftClaim) {
    foundry = _foundry;
    appId = _appId;
    publicNFT = _publicNFT;
    nftClaim = _nftClaim;
  }

  function name() external pure override returns (string memory) {
    return "Gate of Degen";
  }

  function symbol() external pure override returns (string memory) {
    return "GOD";
  }

  function tokenURI(uint256 tokenId) external view override returns (string memory) {
    Info memory info = _getInfo(tokenId);
    string[7] memory styles;

    if (info.percent == 5000) {
      styles = _getCnftStyleStr(info.isClaim);
    } else {
      styles = _getOnftStyleStr(info.isClaim);
    }

    string[22] memory parts;

    parts[
      0
    ] = '<svg width="528" height="527" viewBox="0 0 528 527" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="528" height="527" fill="#1E1E1E"></rect><rect width="527.5" height="526.595" fill="#0F172A"></rect><rect x="25" y="24" width="479.5" height="478.682" rx="16" fill="#1E293B"></rect><rect x="37.5" y="209.5" width="452" height="103" rx="15.5" ';
    parts[1] = styles[0];
    parts[
      2
    ] = ' ></rect><text fill="#A0A0A0" style="white-space: pre" font-family="Courier New" font-size="16" font-weight="bold" letter-spacing="-0.011em"><tspan x="61.0531" y="281.293">- Castle tax distribution right</tspan></text>';

    parts[3] = styles[1];

    parts[4] = styles[2];

    parts[5] = "<text ";
    parts[6] = styles[3];
    parts[
      7
    ] = ' style="white-space: pre" font-family="Courier New" font-size="16" font-weight="bold" letter-spacing="-0.011em"><tspan x="455.925" y="289.293">%</tspan></text><rect x="37.5" y="321.5" width="452" height="111" rx="15.5" ';

    parts[8] = styles[4];
    parts[
      9
    ] = ' ></rect><text fill="#A0A0A0" style="white-space: pre" font-family="Courier New" font-size="16" font-weight="bold" letter-spacing="-0.011em"><tspan x="61" y="389.258">- Followers</tspan></text><text fill="#A3A9AF" style="white-space: pre" font-family="Courier New" font-size="16" font-weight="bold" letter-spacing="-0.011em"><tspan x="465" y="389.258" text-anchor="end">';
    parts[10] = Strings.toString(info.followers);
    parts[
      11
    ] = '</tspan></text><text fill="#A3A9AF" style="white-space: pre" font-family="Courier New" font-size="16" font-weight="bold" letter-spacing="-0.011em"><tspan x="465" y="413.258" text-anchor="end">';
    parts[12] = _datetime(info.timestamp);
    parts[
      13
    ] = '</tspan></text><text fill="#38BDF8" style="white-space: pre" font-family="Courier New" font-size="24" font-weight="bold" letter-spacing="-0.011em"><tspan x="61" y="359.387">Mint fee</tspan></text><text ';
    parts[14] = styles[5];
    parts[
      15
    ] = ' style="white-space: pre" font-family="Courier New" font-size="32" font-weight="bold" letter-spacing="-0.011em"><tspan x="465" y="361.516" text-anchor="end">';
    parts[16] = string(abi.encodePacked(Strings.toString(info.omf / (10 ** 18))));
    parts[
      17
    ] = '</tspan></text><g clip-path="url(#clip1_0_1)"><path fill-rule="evenodd" clip-rule="evenodd" d="M185.764 354.856L185.84 356.244C185.845 356.339 185.88 356.428 185.94 356.501C186.359 357.007 188.237 358.773 192.468 358.773C196.699 358.773 198.554 357.03 198.988 356.51C199.053 356.432 199.091 356.334 199.097 356.232L199.173 354.857C199.677 354.581 200.197 354.269 200.197 354.269C201.014 353.827 201.927 354.462 201.928 355.394C201.931 356.901 200.751 358.45 199.16 359.426C197.366 360.527 194.687 360.984 192.469 360.984C190.251 360.984 187.572 360.527 185.778 359.426C184.186 358.45 183.007 356.902 183.009 355.394C183.011 354.462 183.924 353.827 184.741 354.269C184.741 354.269 185.26 354.58 185.764 354.856Z" fill="#FFA500"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M192.468 345.003C195.928 345.003 196.866 345.083 198.273 345.245H198.272C198.92 345.319 199.44 345.801 199.392 346.453L198.874 353.5C198.712 353.547 198.535 353.606 198.336 353.672C197.297 354.021 195.668 354.567 192.468 354.567C189.269 354.567 187.64 354.021 186.6 353.672C186.402 353.606 186.225 353.547 186.062 353.5L185.544 346.453C185.497 345.801 186.015 345.307 186.664 345.245C188.054 345.11 189.5 345.003 192.468 345.003ZM186.311 356.876L186.313 356.901L186.348 356.909C186.336 356.898 186.323 356.887 186.311 356.876ZM198.591 356.908L198.624 356.901L198.625 356.878C198.614 356.888 198.603 356.898 198.591 356.908Z" fill="#FFA500"></path></g><text fill="#E5E5E5" style="white-space: pre" font-family="Courier New" font-size="32" font-weight="bold" letter-spacing="-0.011em"><tspan x="37.78" y="161.551">@';
    parts[18] = info.tName;
    parts[
      19
    ] = '</tspan></text><path d="M 44.968 86.946 Q 43.336 86.946 41.92 86.418 Q 40.504 85.89 39.592 84.33 Q 38.68 82.77 38.68 79.65 L 38.68 64.098 Q 38.68 61.602 39.664 60.21 Q 40.648 58.818 42.424 58.266 Q 44.2 57.714 46.552 57.714 Q 48.904 57.714 50.704 58.266 Q 52.504 58.818 53.536 60.21 Q 54.568 61.602 54.568 64.098 L 54.568 68.082 L 49.144 68.082 L 49.144 63.81 Q 49.144 62.658 48.832 62.058 Q 48.52 61.458 47.992 61.266 Q 47.464 61.074 46.696 61.074 Q 45.976 61.074 45.424 61.266 Q 44.872 61.458 44.56 62.058 Q 44.248 62.658 44.248 63.81 L 44.248 80.994 Q 44.248 82.098 44.56 82.698 Q 44.872 83.298 45.424 83.514 Q 45.976 83.73 46.696 83.73 Q 47.8 83.73 48.472 83.058 Q 49.144 82.386 49.144 80.994 L 49.144 75.33 L 46.84 75.33 L 46.84 72.162 L 54.568 72.162 L 54.568 86.418 L 50.392 86.418 L 50.104 84.21 Q 50.008 84.354 49.912 84.498 Q 49.816 84.642 49.768 84.738 Q 49.288 85.554 48.16 86.25 Q 47.032 86.946 44.968 86.946 Z M 76.64 86.418 L 81.728 58.05 L 89.696 58.05 L 94.688 86.418 L 88.448 86.418 L 87.584 81.186 L 83.456 81.186 L 82.64 86.418 Z M 83.552 78.402 L 87.536 78.402 L 85.568 62.994 Z M 118.642 86.418 L 118.642 61.986 L 114.226 61.986 L 114.226 58.05 L 128.626 58.05 L 128.626 61.986 L 124.21 61.986 L 124.21 86.418 Z M 151.233 86.418 L 151.233 58.05 L 164.289 58.05 L 164.289 61.986 L 157.041 61.986 L 157.041 69.57 L 163.185 69.57 L 163.185 73.938 L 157.041 73.938 L 157.041 82.578 L 164.289 82.578 L 164.289 86.418 Z" style="fill: rgb(56, 189, 248);"></path><path d="M218.355 39H264.793V105.036H257.976V74.787H257.909C257.156 66.427 250.13 59.8757 241.574 59.8757C233.018 59.8757 225.992 66.427 225.238 74.787H225.172V105.036H218.355V39Z" fill="#8B5CF6"></path><path d="M206 48.3728L208.769 57.7456H211.112V95.6627C209.936 95.6627 208.982 96.6164 208.982 97.7929V100.349H208.556C207.38 100.349 206.426 101.303 206.426 102.479V105.036H230.284V102.479C230.284 101.303 229.33 100.349 228.154 100.349H227.728V97.7929C227.728 96.6164 226.774 95.6627 225.598 95.6627H223.041V48.3728H206Z" fill="#8B5CF6"></path><path d="M258.402 95.6627C257.226 95.6627 256.272 96.6164 256.272 97.7929V100.349H255.846C254.67 100.349 253.716 101.303 253.716 102.479V105.036H277.574V102.479C277.574 101.303 276.62 100.349 275.444 100.349H275.018V97.7929C275.018 96.6164 274.064 95.6627 272.888 95.6627V57.7456H275.231L278 48.3728H260.959V95.6627H258.402Z" fill="#8B5CF6"></path><g clip-path="url(#clip2_0_1)"><path fill-rule="evenodd" clip-rule="evenodd" d="M233.486 84.5722L233.582 86.3434C233.589 86.464 233.634 86.5775 233.709 86.6705C234.237 87.3161 236.606 89.5689 241.943 89.5689C247.281 89.5689 249.621 87.3452 250.169 86.6825C250.251 86.5825 250.299 86.4583 250.307 86.3277L250.402 84.5735C251.037 84.2215 251.693 83.8238 251.693 83.8238C252.725 83.2597 253.876 84.07 253.878 85.2585C253.882 87.1813 252.393 89.1574 250.386 90.4027C248.122 91.8068 244.743 92.3894 241.945 92.3894C239.147 92.3894 235.768 91.8068 233.504 90.4027C231.497 89.1574 230.008 87.182 230.012 85.2585C230.014 84.07 231.165 83.2597 232.196 83.8238C232.196 83.8238 232.851 84.2205 233.486 84.5722Z" fill="#8B5CF6"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M241.944 72.0034C246.308 72.0034 247.492 72.1063 249.266 72.3121H249.265C250.083 72.4071 250.739 73.0216 250.678 73.8539L250.025 82.8427C249.82 82.9025 249.597 82.9781 249.347 83.0628C248.036 83.507 245.98 84.2033 241.944 84.2033C237.908 84.2033 235.853 83.507 234.542 83.0628C234.291 82.978 234.068 82.9023 233.863 82.8425L233.21 73.8539C233.149 73.0216 233.803 72.3922 234.622 72.3121C236.375 72.1404 238.2 72.0034 241.944 72.0034ZM234.176 87.1496L234.179 87.1812L234.224 87.1917C234.208 87.1775 234.192 87.1635 234.176 87.1496ZM249.668 87.1907L249.709 87.1812L249.711 87.1525C249.697 87.1651 249.683 87.1778 249.668 87.1907Z" fill="#8B5CF6"></path></g><path d="M 320.954 86.418 L 320.954 58.05 L 330.89 58.05 Q 332.906 58.05 334.226 58.626 Q 335.546 59.202 336.194 60.378 Q 336.842 61.554 336.842 63.33 L 336.842 80.322 Q 336.842 82.674 336.026 84.018 Q 335.21 85.362 333.698 85.89 Q 332.186 86.418 330.122 86.418 Z M 326.762 83.538 L 329.21 83.538 Q 330.17 83.538 330.722 82.962 Q 331.274 82.386 331.274 80.802 L 331.274 63.954 Q 331.274 62.37 330.722 61.794 Q 330.17 61.218 329.21 61.218 L 326.762 61.218 Z M 360.693 86.418 L 360.693 58.05 L 373.749 58.05 L 373.749 61.986 L 366.501 61.986 L 366.501 69.57 L 372.645 69.57 L 372.645 73.938 L 366.501 73.938 L 366.501 82.578 L 373.749 82.578 L 373.749 86.418 Z M 402.837 86.946 Q 401.205 86.946 399.789 86.418 Q 398.373 85.89 397.461 84.33 Q 396.549 82.77 396.549 79.65 L 396.549 64.098 Q 396.549 61.602 397.533 60.21 Q 398.517 58.818 400.293 58.266 Q 402.069 57.714 404.421 57.714 Q 406.773 57.714 408.573 58.266 Q 410.373 58.818 411.405 60.21 Q 412.437 61.602 412.437 64.098 L 412.437 68.082 L 407.013 68.082 L 407.013 63.81 Q 407.013 62.658 406.701 62.058 Q 406.389 61.458 405.861 61.266 Q 405.333 61.074 404.565 61.074 Q 403.845 61.074 403.293 61.266 Q 402.741 61.458 402.429 62.058 Q 402.117 62.658 402.117 63.81 L 402.117 80.994 Q 402.117 82.098 402.429 82.698 Q 402.741 83.298 403.293 83.514 Q 403.845 83.73 404.565 83.73 Q 405.669 83.73 406.341 83.058 Q 407.013 82.386 407.013 80.994 L 407.013 75.33 L 404.709 75.33 L 404.709 72.162 L 412.437 72.162 L 412.437 86.418 L 408.261 86.418 L 407.973 84.21 Q 407.877 84.354 407.781 84.498 Q 407.685 84.642 407.637 84.738 Q 407.157 85.554 406.029 86.25 Q 404.901 86.946 402.837 86.946 Z M 436.14 86.418 L 436.14 58.05 L 449.196 58.05 L 449.196 61.986 L 441.948 61.986 L 441.948 69.57 L 448.092 69.57 L 448.092 73.938 L 441.948 73.938 L 441.948 82.578 L 449.196 82.578 L 449.196 86.418 Z M 472.332 86.418 L 472.332 58.05 L 477.18 58.05 L 483.084 75.234 L 483.084 58.05 L 487.98 58.05 L 487.98 86.418 L 483.132 86.418 L 477.228 70.386 L 477.228 86.418 Z" style="fill: rgb(56, 189, 248);"></path><defs>';
    parts[20] = styles[6];
    parts[
      21
    ] = '<clipPath id="clip1_0_1"><rect width="18.93" height="16" fill="white" transform="translate(183 345)"></rect></clipPath><clipPath id="clip2_0_1"><rect width="23.88" height="20.41" fill="white" transform="translate(230 72)"></rect></clipPath></defs></svg>';

    return _pack(tokenId, parts);
  }

  function _getInfo(uint256 tokenId) private view returns (Info memory info) {
    (info.tid, info.percent, , ) = IPublicNFT(publicNFT).tokenIdToInfo(tokenId);

    bytes memory data = IFoundry(foundry).tokenData(appId, info.tid);
    (info.tName, info.cid, info.cName, info.followers, info.omf, info.timestamp) = abi.decode(
      data,
      (string, string, string, uint256, uint256, uint256)
    );
    info.isClaim = INFTClaim(nftClaim).isClaim(info.tid);
  }

  function _getCnftStyleStr(bool isClaim) private pure returns (string[7] memory parts) {
    string memory a;
    string memory b;
    if (isClaim) {
      a = 'stroke="#FFA500"';
      b = 'fill="#FFA500"';
    } else {
      a = 'stroke="#A3E635"';
      b = 'fill="#A3E635"';
    }

    parts[0] = a;
    parts[
      1
    ] = '<text fill="#38BDF8" style="white-space: pre" font-family="Courier New" font-size="24" font-weight="bold" letter-spacing="-0.011em"><tspan x="61.0531" y="247.422">Key</tspan></text><path d="M124.992 232C122.168 232 119.868 234.301 119.868 237.124C119.868 237.461 119.903 237.798 119.972 238.135L120.019 238.379L114 244.398V248H118.206V245.908H120.17V243.945H122.11V241.969H122.773V241.784L123.377 241.981C123.888 242.155 124.434 242.237 124.969 242.237C127.792 242.237 130.093 239.936 130.093 237.113C130.116 234.301 127.816 232 124.992 232ZM126.909 236.288C126.909 236.88 126.421 237.368 125.829 237.368C125.236 237.368 124.748 236.88 124.748 236.288C124.748 235.695 125.236 235.207 125.829 235.207C126.421 235.207 126.909 235.683 126.909 236.288Z" fill="#FFA500"></path>';
    parts[2] = string(
      abi.encodePacked(
        '<path d="M437.064 287.5C434.223 287.5 431.68 286.988 429.436 285.965C427.192 284.927 425.409 283.508 424.088 281.706C422.781 279.905 422.085 277.844 422 275.524H429.67C429.813 277.243 430.587 278.649 431.993 279.741C433.399 280.819 435.089 281.358 437.064 281.358C438.612 281.358 439.99 281.017 441.197 280.335C442.405 279.652 443.357 278.704 444.053 277.489C444.749 276.274 445.089 274.889 445.075 273.333C445.089 271.75 444.741 270.344 444.031 269.116C443.321 267.888 442.348 266.926 441.112 266.23C439.876 265.52 438.456 265.165 436.851 265.165C435.544 265.151 434.259 265.383 432.994 265.861C431.73 266.339 430.729 266.967 429.99 267.744L422.852 266.618L425.132 245H450.445V251.346H431.673L430.416 262.463H430.672C431.482 261.548 432.625 260.791 434.102 260.19C435.58 259.576 437.199 259.269 438.96 259.269C441.602 259.269 443.96 259.87 446.034 261.071C448.108 262.258 449.741 263.896 450.935 265.984C452.128 268.072 452.724 270.46 452.724 273.149C452.724 275.92 452.057 278.39 450.722 280.56C449.401 282.716 447.561 284.416 445.203 285.658C442.859 286.886 440.146 287.5 437.064 287.5Z" ',
        b,
        " ></path>"
      )
    );
    parts[3] = a;
    parts[4] = a;
    parts[5] = b;
    parts[6] = "";
  }

  function _getOnftStyleStr(bool isClaim) private pure returns (string[7] memory parts) {
    string memory a;
    string memory b;
    if (isClaim) {
      a = 'stroke="#FFA500"';
      b = 'fill="#FFA500"';
    } else {
      a = 'stroke="#A3E635"';
      b = 'fill="#A3E635"';
    }

    parts[0] = a;
    parts[
      1
    ] = '<text fill="#38BDF8" style="white-space: pre" font-family="Courier New" font-size="24" font-weight="bold" letter-spacing="-0.011em"><tspan x="61.0531" y="247.422">Lord</tspan></text><g clip-path="url(#clip0_0_1)"><path d="M143 233H126V249H143V233Z" fill="#1E1E1E"></path><path d="M201.91 223.687H77.3611V349.441H201.91V223.687Z" fill="#0F172A"></path><path d="M192.701 229.418H87.0417C84.9553 229.418 83.2639 231.129 83.2639 233.239V339.909C83.2639 342.019 84.9553 343.73 87.0417 343.73H192.701C194.788 343.73 196.479 342.019 196.479 339.909V233.239C196.479 231.129 194.788 229.418 192.701 229.418Z" fill="#1E293B"></path><path d="M128.917 233H139.882V248.77H138.272V241.546H138.256C138.078 239.55 136.42 237.985 134.399 237.985C132.379 237.985 130.72 239.55 130.542 241.546H130.527V248.77H128.917V233Z" fill="#FFA500"></path><path d="M126 235.238L126.654 237.477H127.207V246.531C126.929 246.531 126.704 246.759 126.704 247.04V247.651H126.604C126.326 247.651 126.101 247.878 126.101 248.159V248.77H131.734V248.159C131.734 247.878 131.509 247.651 131.231 247.651H131.13V247.04C131.13 246.759 130.905 246.531 130.627 246.531H130.024V235.238H126Z" fill="#FFA500"></path><path d="M138.373 246.531C138.095 246.531 137.87 246.759 137.87 247.04V247.651H137.769C137.491 247.651 137.266 247.878 137.266 248.159V248.77H142.899V248.159C142.899 247.878 142.674 247.651 142.396 247.651H142.296V247.04C142.296 246.759 142.071 246.531 141.793 246.531V237.477H142.346L143 235.238H138.976V246.531H138.373Z" fill="#FFA500"></path></g>';
    parts[2] = string(
      abi.encodePacked(
        '<path d="M400.731 246.036C402.715 246.05 404.645 246.4 406.521 247.087C408.411 247.76 410.112 248.864 411.623 250.4C413.135 251.921 414.336 253.962 415.227 256.52C416.118 259.079 416.563 262.244 416.563 266.015C416.577 269.57 416.199 272.748 415.429 275.55C414.674 278.337 413.587 280.694 412.17 282.62C410.753 284.546 409.045 286.013 407.048 287.024C405.05 288.034 402.803 288.539 400.306 288.539C397.688 288.539 395.366 288.027 393.342 287.003C391.331 285.98 389.704 284.579 388.463 282.802C387.221 281.024 386.458 278.99 386.175 276.701H393.564C393.942 278.344 394.712 279.65 395.872 280.62C397.047 281.576 398.525 282.054 400.306 282.054C403.181 282.054 405.394 280.808 406.947 278.317C408.499 275.826 409.275 272.365 409.275 267.934H408.991C408.33 269.119 407.473 270.142 406.42 271.004C405.367 271.853 404.173 272.506 402.837 272.964C401.514 273.422 400.11 273.651 398.626 273.651C396.196 273.651 394.01 273.072 392.066 271.913C390.136 270.755 388.604 269.166 387.471 267.146C386.35 265.126 385.783 262.816 385.77 260.217C385.77 257.524 386.391 255.106 387.632 252.965C388.888 250.81 390.636 249.113 392.876 247.875C395.117 246.622 397.735 246.009 400.731 246.036ZM400.752 252.096C399.294 252.096 397.978 252.453 396.804 253.167C395.643 253.867 394.725 254.824 394.05 256.036C393.389 257.234 393.058 258.574 393.058 260.056C393.072 261.523 393.402 262.857 394.05 264.055C394.712 265.254 395.609 266.203 396.743 266.904C397.89 267.604 399.199 267.954 400.671 267.954C401.764 267.954 402.783 267.745 403.728 267.328C404.672 266.91 405.496 266.331 406.198 265.591C406.913 264.836 407.466 263.981 407.858 263.025C408.263 262.069 408.458 261.059 408.445 259.995C408.445 258.581 408.107 257.275 407.433 256.076C406.771 254.877 405.86 253.915 404.699 253.187C403.552 252.46 402.236 252.096 400.752 252.096Z" ',
        b,
        ' ></path><path d="M437.036 288.539C434.336 288.539 431.92 288.034 429.788 287.024C427.655 286 425.961 284.599 424.706 282.822C423.464 281.044 422.803 279.011 422.722 276.721H430.01C430.145 278.418 430.881 279.805 432.217 280.883C433.553 281.946 435.159 282.478 437.036 282.478C438.507 282.478 439.816 282.142 440.963 281.468C442.11 280.795 443.015 279.859 443.676 278.66C444.337 277.462 444.661 276.095 444.648 274.56C444.661 272.997 444.331 271.61 443.656 270.398C442.981 269.186 442.056 268.237 440.882 267.55C439.708 266.85 438.358 266.5 436.833 266.5C435.591 266.486 434.37 266.715 433.169 267.186C431.967 267.658 431.016 268.277 430.314 269.045L423.532 267.934L425.698 246.602H449.75V252.864H431.913L430.719 263.833H430.962C431.731 262.931 432.818 262.183 434.221 261.591C435.625 260.985 437.164 260.682 438.837 260.682C441.348 260.682 443.588 261.274 445.559 262.459C447.529 263.631 449.082 265.247 450.215 267.308C451.349 269.368 451.916 271.725 451.916 274.378C451.916 277.112 451.282 279.549 450.013 281.691C448.758 283.818 447.01 285.495 444.769 286.721C442.542 287.933 439.964 288.539 437.036 288.539Z" ',
        b,
        " ></path>"
      )
    );
    parts[3] = a;
    parts[4] = a;
    parts[5] = b;
    parts[
      6
    ] = '<clipPath id="clip0_0_1"><rect width="17" height="16" fill="white" transform="translate(126 233)"></rect></clipPath>';
  }

  function _datetime(uint256 timestamp) private pure returns (string memory date) {
    (uint256 year, uint256 month, uint256 day) = BokkyPooBahsDateTimeLibrary.timestampToDate(timestamp);
    string memory yearStr = Strings.toString(year);
    string memory monthStr = Strings.toString(month);
    string memory dayStr = Strings.toString(day);
    if (bytes(dayStr).length == 1) {
      dayStr = string(abi.encodePacked("0", dayStr));
    }
    if (bytes(monthStr).length == 1) {
      monthStr = string(abi.encodePacked("0", monthStr));
    }
    date = string(abi.encodePacked(monthStr, "/", dayStr, "/", yearStr));
  }

  function _pack(uint256 tokenId, string[22] memory parts) private view returns (string memory output) {
    string memory partsOutput = string(
      abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6])
    );

    partsOutput = string(abi.encodePacked(partsOutput, parts[7], parts[8], parts[9], parts[10], parts[11], parts[12]));

    partsOutput = string(
      abi.encodePacked(partsOutput, parts[13], parts[14], parts[15], parts[16], parts[17], parts[18])
    );

    partsOutput = string(abi.encodePacked(partsOutput, parts[19], parts[20], parts[21]));

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "',
            _name(tokenId),
            '", "description": "',
            _desc(tokenId),
            '", "image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(partsOutput)),
            '"}'
          )
        )
      )
    );
    output = string(abi.encodePacked("data:application/json;base64,", json));
  }

  function _name(uint256 tokenId) private view returns (string memory) {
    Info memory info = _getInfo(tokenId);
    string memory _type = "";
    if (info.percent == 5000) {
      _type = "Key";
    } else {
      _type = "Lord";
    }
    return string(abi.encodePacked("@", info.tName, " - ", _type));
  }

  function _desc(uint256 tokenId) private view returns (string memory) {
    Info memory info = _getInfo(tokenId);
    if (info.percent == 5000) {
      return
        string(
          abi.encodePacked(
            "The Keyholder to receive 100% of the total castle tax from @",
            info.tName,
            "'s trades. Once @",
            info.tName,
            " takes over the castle, the Keyholder will then receive 5%."
          )
        );
    } else {
      return
        string(
          abi.encodePacked(
            "This lord holder to receive 95% of the total castle tax from @",
            info.tName,
            "'s trades once @",
            info.tName,
            " takes over the castle."
          )
        );
    }
  }
}
