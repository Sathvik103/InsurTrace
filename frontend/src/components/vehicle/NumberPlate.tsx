/** Registration styled like an Indian number plate. Commercial vehicles get the yellow plate. */
export function NumberPlate({ value, commercial = false, className = '' }: { value: string; commercial?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-stretch overflow-hidden rounded-[5px] border-[1.5px] border-navy-950 font-mono text-[11px] font-bold leading-none tracking-wider ${commercial ? 'bg-[#f7d23e]' : 'bg-white'} ${className}`}
    >
      <span className="flex items-center bg-[#1f4fa3] px-1 text-[7px] text-white">IND</span>
      <span className="px-1.5 py-1 text-navy-950">{value}</span>
    </span>
  );
}
