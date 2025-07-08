"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicSharedLists } from "../../../services/custom-api";
import { EyeIcon } from "@heroicons/react/24/outline";

interface SharedList {
  id: string;
  name: string;
  cart_id: string;
  is_public: boolean;
  total_items: number;
  meta?: { timestamps?: { created_at?: string } };
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<SharedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    setLoading(true);
    try {
      const response = await getPublicSharedLists();
      if (response.success) {
        setCollections(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch collections");
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : "-";
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Collections</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">Loading collections...</div>
          </div>
        ) : collections.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">No public collections found.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {collections.map((list) => (
                  <tr
                    key={list.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/collections/${list.cart_id}`)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {list.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {list.total_items} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(list?.meta?.timestamps?.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
