import { describe, expect, it } from "vitest";
import { analyzeCapabilities } from "@/lib/services/etherscan/capabilities";

describe("analyzeCapabilities", () => {
  it("detects a mint function", () => {
    const src = "contract Foo { function mint(address to, uint256 amount) public onlyOwner {} }";
    expect(analyzeCapabilities(src).hasMintFunction).toBe(true);
  });

  it("detects burn and burnFrom", () => {
    expect(analyzeCapabilities("function burn(uint256 amount) public {}").hasBurnFunction).toBe(true);
    expect(analyzeCapabilities("function burnFrom(address a, uint256 b) public {}").hasBurnFunction).toBe(true);
  });

  it("detects pausable contracts via Pausable inheritance or whenNotPaused", () => {
    expect(analyzeCapabilities("contract Foo is Pausable {}").hasPauseFunction).toBe(true);
    expect(analyzeCapabilities("function transfer() whenNotPaused {}").hasPauseFunction).toBe(true);
  });

  it("detects blacklist-style functions", () => {
    expect(analyzeCapabilities("function blacklist(address a) public {}").hasBlacklistFunction).toBe(true);
    expect(analyzeCapabilities("mapping(address => bool) isBlacklisted;").hasBlacklistFunction).toBe(true);
  });

  it("detects owner privileges via onlyOwner or Ownable", () => {
    expect(analyzeCapabilities("contract Foo is Ownable {}").hasOwnerPrivileges).toBe(true);
    expect(analyzeCapabilities("function x() onlyOwner {}").hasOwnerPrivileges).toBe(true);
  });

  it("reports all flags false for a plain ERC-20 with none of these patterns", () => {
    const src = `
      contract PlainToken {
        mapping(address => uint256) balances;
        function transfer(address to, uint256 amount) public returns (bool) { return true; }
      }
    `;
    const flags = analyzeCapabilities(src);
    expect(flags).toEqual({
      hasMintFunction: false,
      hasBurnFunction: false,
      hasPauseFunction: false,
      hasBlacklistFunction: false,
      hasOwnerPrivileges: false,
    });
  });

  it("is case-insensitive for function-name patterns", () => {
    expect(analyzeCapabilities("function MINT(uint256 x) public {}").hasMintFunction).toBe(true);
  });
});
