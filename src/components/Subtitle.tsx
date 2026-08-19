export default function Subtitle({ text }: { text: string }) {
  return (
    <p className="text-sm leading-relaxed mt-2 pt-2 border-t border-[rgba(212,175,55,0.1)]">
      <span className="text-[#d4af37] text-xs font-semibold uppercase tracking-wider mr-2">
        перевод:
      </span>
      <span className="text-[#bdc3c7] italic">
        {text}
      </span>
    </p>
  );
}
