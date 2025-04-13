// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WordGuessNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    uint256 public mintFee = 0.001 ether;

    struct WordData {
        string word;
        uint256 timestamp;
    }

    mapping(uint256 => WordData) public tokenMetadata;

    constructor() ERC721("WordGuessVictory", "WGV") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    function mint(address to, string memory word) external payable {
        require(msg.value >= mintFee, "Insufficient mint fee");
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        tokenMetadata[tokenId] = WordData(word, block.timestamp);
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        WordData memory data = tokenMetadata[tokenId];
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                "eyJuYW1lIjoiV29yZCBHdWVzcyBWaWN0b3J5IiwgImRlc2NyaXB0aW9uIjoiV2lubmluZyB3b3JkOiA",
                data.word,
                "IiwgImF0dHJpYnV0ZXMiOiB7InRpbWVzdGFtcCI6IC",
                uintToString(data.timestamp),
                "fX0="
            )
        );
    }

    function uintToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 j = v;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (v != 0) {
            k--;
            bstr[k] = bytes1(uint8(48 + v % 10));
            v /= 10;
        }
        return string(bstr);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
