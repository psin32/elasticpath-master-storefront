"use client";

import Link from "next/link";
import { useState } from "react";
import EpLogo from "../../../components/icons/ep-logo";
import {
  HomeIcon,
  ShoppingCartIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <html lang="en">
      <body>
        <div className="grid grid-cols-[250px_1fr] h-screen">
          <aside className="bg-gray-900 text-white px-6 py-8">
            <EpLogo className="w-40" />
            <nav className="space-y-4 mt-10">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-3 text-md font-semibold hover:text-gray-300 transition duration-300"
              >
                <HomeIcon className="w-6 h-6" />
                <span>Home</span>
              </Link>
              <Link
                href="/admin/accounts"
                className="flex items-center space-x-3 text-md font-semibold hover:text-gray-300 transition duration-300"
              >
                <UserGroupIcon className="w-6 h-6" />
                <span>Accounts</span>
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center space-x-3 text-md font-semibold hover:text-gray-300 transition duration-300"
              >
                <ShoppingCartIcon className="w-6 h-6" />
                <span>Orders</span>
              </Link>
            </nav>
          </aside>

          <div className="bg-gray-50 flex flex-col">
            <header className="bg-white shadow-md p-4 flex justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-700">Dashboard</h1>
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-200 focus:outline-none transition"
                >
                  <span className="font-medium text-gray-700">Username</span>
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20">
                    <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </header>

            <main className="p-8 overflow-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
