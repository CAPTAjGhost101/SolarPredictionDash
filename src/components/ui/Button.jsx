export default function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        bg-[var(--primary)]
        hover:bg-[var(--primary-hover)]
        text-white
        px-4 py-2
        rounded-lg
        transition
      "
    >
      {children}
    </button>
  );
}
