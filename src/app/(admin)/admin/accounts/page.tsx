"use client";

import { useEffect, useState } from "react";
import { getAccountMembers, impersonateUser } from "./actions";
import { useRouter } from "next/navigation";
import { StatusButton } from "../../../../components/button/StatusButton";
import { Overlay } from "../../../../components/overlay/Overlay";
import { useSession } from "next-auth/react";
import AdminSpinner from "../../../../components/AdminSpinner";

export default function AccountsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [accountMembers, setAccountMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);

  if (status == "unauthenticated") {
    router.push("/admin");
  }

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
    accountMembers && (
      <div className="p-8 shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold mb-6">Account Members</h2>

        <div className="mb-6 flex items-center space-x-4">
          <input
            type="email"
            placeholder="Enter email address"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring focus:outline-none w-1/3"
          />
          <StatusButton
            onClick={handleFindMember}
            className="text-sm rounded-lg"
          >
            Find
          </StatusButton>
          <StatusButton
            onClick={handleClearSearch}
            className="text-sm rounded-lg bg-gray-500"
          >
            Clear Search
          </StatusButton>
        </div>

        {error && (
          <div className="p-4 mb-4 text-red-600 bg-red-100 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Edit</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {accountMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-200">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {member.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {member.email}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <StatusButton
                            onClick={() => handleOrderOnBehalf(member.id)}
                            className="py-2 text-sm"
                            variant="secondary"
                          >
                            Order on behalf
                          </StatusButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {!loading && accountMembers.length === 0 && !error && (
          <div className="p-4 text-gray-600">No account members found.</div>
        )}

        <Overlay
          isOpen={isOverlayOpen}
          onClose={handleCancel}
          onConfirm={handleConfirm}
        />

        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
            <AdminSpinner />
          </div>
        )}
      </div>
    )
  );
}
