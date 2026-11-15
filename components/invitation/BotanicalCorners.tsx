import Image from "next/image";

export default function BotanicalCorners({ enabled = true }: { enabled?: boolean }) {
  if (!enabled) return null;
  return (
    <div className="botanical-frame" aria-hidden="true">
      <div className="botanical-corner botanical-top">
        <Image src="/images/current/floral-paper.webp" alt="" fill sizes="(max-width: 553px) 144px, (max-width: 1292px) 26vw, 336px" className="object-cover object-top" />
      </div>
      <div className="botanical-corner botanical-bottom">
        <Image src="/images/current/floral-paper.webp" alt="" fill sizes="(max-width: 553px) 144px, (max-width: 1292px) 26vw, 336px" className="object-cover object-bottom" />
      </div>
    </div>
  );
}
