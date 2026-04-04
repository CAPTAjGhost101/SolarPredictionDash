export default function Card({ children }) {
  return <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">{children}</div>;
}
