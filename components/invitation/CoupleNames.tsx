export default function CoupleNames({ groom, bride, className = "" }: { groom: string; bride: string; className?: string }) {
  return (
    <span className={`couple-names script ${className}`}>
      <span>{groom}</span>
      <span className="couple-ampersand">&amp;</span>
      <span>{bride}</span>
    </span>
  );
}
