import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getCurrentUser,
  logout,
} from "../api/API.js";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error(error);
      }
    }

    checkUser();
  }, []);

  async function handleLogout() {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <nav className="bg-surface border-b border-border">
      <div className="mx-auto max-w-5xl px-4 md:px-8 h-16 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-primary"
        >
          <span className="grid place-items-center size-8 rounded-lg bg-primary text-white text-sm">
            DD
          </span>

          DormDash
        </Link>

        <div className="flex gap-6 text-sm text-body">
          <Link
            to="/"
            className="hover:text-primary"
          >
            Home
          </Link>

          {user ? (
            <button
              onClick={handleLogout}
              className="cursor-pointer hover:text-primary"
            >
              Log out
            </button>
          ) : (
            <Link
              to="/login"
              className="hover:text-primary"
            >
              Log in
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}