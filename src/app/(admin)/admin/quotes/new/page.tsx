"use client";

import { useEffect, useState } from "react";
import { StatusButton } from "../../../../../components/button/StatusButton";
import { getAccountMembers, impersonateUser } from "../../accounts/actions";
import AccountSelector from "./AccountSelector";

export default function QuotesPage() {
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any>();
  const [accountMember, setAccountMember] = useState<any>();

  useEffect(() => {
    async function fetchData() {}
    fetchData();
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
      if (response?.data?.length === 0) {
        setError("No member found with the provided email.");
      } else {
        setAccountMember(response.data[0]);
        const accountMemberId = response.data[0].id;
        const account = await impersonateUser(accountMemberId);
        setAccounts(account.data);
      }
      setLoading(false);
    } catch (error) {
      setError("No member found with the provided email.");
      setLoading(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchEmail("");
    setError(null);
  };

  return (
    <div className="p-8 shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Create New Quote</h2>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4 w-1/2">
          <input
            type="email"
            placeholder="Enter customer email address"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring focus:outline-none w-full"
          />
          <StatusButton
            onClick={handleFindMember}
            className="text-sm rounded-lg"
            status={loading ? "loading" : "idle"}
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
      </div>

      {error && (
        <div className="p-4 mb-4 text-red-600 bg-red-100 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {accounts && (
        <AccountSelector accounts={accounts} accountMember={accountMember} />
      )}
    </div>
  );
}
