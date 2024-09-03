"use client";

import { useEffect, useState } from "react";
import { getAccountMembers, impersonateUser } from "./actions";
import Overlay from "../../../../components/overlay/Overlay";
import { useRouter } from "next/navigation";

export default function AccountsPage() {
  const router = useRouter();
  const [accountMembers, setAccountMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchAllAccountMembers = async () => {
      setLoading(true);
      try {
        const response = await getAccountMembers();
        setAccountMembers(response.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to load account members.");
        setLoading(false);
      }
    };

    fetchAllAccountMembers();
  }, []);

  const handleFindMember = async () => {
    if (!searchEmail) {
      alert("Please enter an email address to search");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getAccountMembers(encodeURIComponent(searchEmail));
      setAccountMembers(response.data);
      setLoading(false);
    } catch (error) {
      setError("No member found with the provided email.");
      setLoading(false);
      setAccountMembers([]);
    }
  };

  const handleClearSearch = async () => {
    setSearchEmail("");
    setError(null);

    try {
      const response = await getAccountMembers();
      setAccountMembers(response.data);
    } catch (error) {
      setError("Failed to reload account members.");
    }
  };

  const handleOrderOnBehalf = (id: string) => {
    setSelectedMemberId(id);
    setIsOverlayOpen(true);
  };

  const handleConfirm = async () => {
    if (selectedMemberId === null) return;

    setIsOverlayOpen(false);
    setLoading(true);

    try {
      await impersonateUser(selectedMemberId);
      alert("Redirecting to shopping experience...");
      router.push("/");
      setLoading(false);
    } catch (error) {
      setError("Failed to impersonate user.");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsOverlayOpen(false); // Close the overlay
  };

  return (
    <div className="p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Account Members</h2>

      <div className="mb-6 flex items-center space-x-4">
        <input
          type="email"
          placeholder="Enter email address"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring focus:outline-none"
        />
        <button
          onClick={handleFindMember}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition"
        >
          Find
        </button>
        <button
          onClick={handleClearSearch}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
        >
          Clear Search
        </button>
      </div>

      {loading && <div className="p-4">Loading...</div>}

      {error && (
        <div className="p-4 mb-4 text-red-600 bg-red-100 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {accountMembers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto bg-gray-50 border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-4 border-b font-medium text-gray-600">Name</th>
                <th className="p-4 border-b font-medium text-gray-600">
                  Email
                </th>
                <th className="p-4 border-b font-medium text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {accountMembers.map((member) => (
                <tr
                  key={member.id}
                  className="bg-white hover:bg-gray-50 transition"
                >
                  <td className="p-4 border-b text-gray-700">{member.name}</td>
                  <td className="p-4 border-b text-gray-700">{member.email}</td>
                  <td className="p-4 border-b">
                    <button
                      onClick={() => handleOrderOnBehalf(member.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition"
                    >
                      Order on behalf
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && accountMembers.length === 0 && !error && (
        <div className="p-4 text-gray-600">No account members found.</div>
      )}

      <Overlay
        isOpen={isOverlayOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
