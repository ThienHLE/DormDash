import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getCurrentUser,
  logout,
} from "../api/API.js";


export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();


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

      navigate("/login");
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

          {/* New Links for logged-in users AE [10/05]*/}
          {user && (
            <>
            <Link
              to="/dashboard"
              className="hover:text-primary">
              Dashboard
            </Link>
            
            <Link
              to="/new-request"
              className="hover:text-primary"
            >
                New Request
              </Link>   
              </>        
          )}


          {user?.admin && (
            <Link
              to="/admin"
              className="hover:text-primary"
            >
              Admin
            </Link>
          )}


          {user ? (
            <button
              type="button"
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