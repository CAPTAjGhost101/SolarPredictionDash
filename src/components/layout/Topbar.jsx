import ThemeToggle from "../ui/ThemeToggle";
import { auth, provider } from "../../firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { useTranslate } from "../../utils/useTranslate";
export default function Topbar({ onMenuClick }) {
  const { t } = useTranslate();
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
        bg-[var(--bg)] hover:bg-[var(--border)] px-2 py-1 rounded-lg transition
      "
    >
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg hover:bg-[var(--border)]">
          <Menu size={20} />
        </button>

        <h2 className="text-lg font-semibold">{t("dashboard")}</h2>
      </div>

      <div className="flex items-center gap-4">
        {!user ? (
          <button onClick={handleLogin} className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:opacity-90 transition">
            {t("login")}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src={user.photoURL} className="w-6 h-6 rounded-full object-cover border-amber-500 ring-2 ring-amber-500" />
              <p className="text-sm">{user.displayName}</p>
            </div>

            <button
              onClick={handleLogout}
              className="
    px-3 py-1.5 rounded-lg
    bg-red-500/10 text-red-500
    hover:bg-red-500 hover:text-white
    transition-all text-xs font-medium
  "
            >
              {t("logout")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
