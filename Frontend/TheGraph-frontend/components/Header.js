import { ConnectButton } from "web3uikit";
import Link from "next/link";

export default function Header() {
  return (
    <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
      <h1 className=" py-4 px-4 font-bold text-3xl">APE JUNGLE</h1>
      <div className="flex flex-row items-center">
        <Link href="/" legacyBehavior>
          <a className="mr-6 p-6">Home</a>
        </Link>

        <Link href="/sell-nft" legacyBehavior>
          <a className="mr-6 p-6">Sell</a>
        </Link>
        {/* we dont wan to automatically connect to the Moralis database when we connect we want to connect with our Metamask */}
        <ConnectButton moralisAuth={false} />
      </div>
    </nav>
  );
}
