import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="w-full border-b border-zinc-200 bg-white px-6 py-3 flex items-center">
      <Link href="/" className="flex items-center">
        <Image
          src="/hackmatch_wordmark.svg"
          alt="HackMatch"
          width={155}
          height={40}
          priority
        />
      </Link>
    </header>
  );
}
