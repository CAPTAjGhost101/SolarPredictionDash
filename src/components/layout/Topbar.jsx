import ThemeToggle from "../ui/ThemeToggle";
import { auth, provider } from "../../firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { useState, useEffect } from "react";

export default function Topbar() {
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log(result.user);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div
      className="
        h-16
        border-b border-[var(--border)]
        flex items-center justify-between
        px-6
        bg-[var(--bg)]
      "
    >
      <h2 className="text-lg font-semibold">Dashboard</h2>

      <div className="flex items-center gap-4">
        {!user ? (
          <button onClick={handleLogin} className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:opacity-90 transition">
            Login
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <img src={user.photoURL} className="w-8 h-8 rounded-full" />
            <p className="text-sm">{user.displayName}</p>
            <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">
              Logout
            </button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}
