import { ConnectButton } from "@/components/connect-button";
import { LockClosedIcon } from "@/components/icons";

// The sticky, paper-blurred top bar: the cloakly wordmark and the wallet control.
export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "rgba(244,241,233,0.8)",
        backdropFilter: "blur(14px) saturate(1.1)",
        WebkitBackdropFilter: "blur(14px) saturate(1.1)",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <div className="mx-auto flex h-[68px] max-w-[68rem] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <LockClosedIcon size={17} className="text-bronze" />
          <span className="font-serif text-[22px] font-semibold tracking-[-0.02em] text-ink">cloakly</span>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
