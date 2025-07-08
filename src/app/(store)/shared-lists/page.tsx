"use client";
import { useState, useEffect } from "react";
import { Button } from "../../../components/button/Button";
import Link from "next/link";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";
import {
  createOrUpdateSharedListEntry,
  getSharedLists,
} from "../../../services/custom-api";
import { deleteSharedListEntry } from "../../../services/custom-api";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface SharedList {
  id: string;
  account_member_id: string;
  name: string;
  cart_id: string;
  is_public: boolean;
  total_items: number;
  created_at: string;
  updated_at: string;
}

export default function SharedListsPage() {
  const [listName, setListName] = useState("");
  const [createdListId, setCreatedListId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [sharedLists, setSharedLists] = useState<SharedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit overlay state
  const [showEditOverlay, setShowEditOverlay] = useState(false);
  const [editingList, setEditingList] = useState<SharedList | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete overlay state
  const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
  const [deletingList, setDeletingList] = useState<SharedList | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchSharedLists();
  }, []);

  async function fetchSharedLists() {
    setLoading(true);
    try {
      const response = await getSharedLists();
      if (response.success) {
        setSharedLists(response.data);
      } else {
        // setError(response.error || "Failed to fetch shared lists");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch shared lists");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteClick(list: SharedList) {
    setDeletingList(list);
    setShowDeleteOverlay(true);
    setDeleteError("");
  }

  async function handleConfirmDelete() {
    if (!deletingList) return;

    setDeleting(true);
    try {
      const response = await deleteSharedListEntry(deletingList.cart_id);
      if (response.success) {
        // Refresh the list after successful deletion
        await fetchSharedLists();
        setShowDeleteOverlay(false);
        setDeletingList(null);
      } else {
        setDeleteError("Failed to delete shared list");
      }
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete shared list");
    } finally {
      setDeleting(false);
    }
  }

  async function handleEdit(list: SharedList) {
    setEditingList(list);
    setEditName(list.name);
    setEditIsPublic(list.is_public);
    setShowEditOverlay(true);
    setEditError("");
  }

  async function handleSaveEdit() {
    if (!editingList || !editName.trim()) {
      setEditError("Name is required");
      return;
    }

    setSaving(true);
    try {
      await createOrUpdateSharedListEntry({
        account_member_id: editingList.account_member_id,
        cart_id: editingList.cart_id,
        is_public: editIsPublic,
        name: editName,
        total_items: editingList.total_items,
      });

      // For now, just close the overlay
      setShowEditOverlay(false);
      setEditingList(null);
      setEditName("");
      setEditIsPublic(false);

      // Refresh the list after editing
      await fetchSharedLists();
    } catch (err: any) {
      setEditError(err.message || "Failed to update shared list");
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Shared Lists</h1>

      {/* Shared Lists Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">Loading shared lists...</div>
          </div>
        ) : sharedLists.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">
              No shared lists found. Create your first one above!
            </div>
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
                    Visibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sharedLists.map((list: any) => (
                  <tr key={list.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          list.is_public
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {list.is_public ? "Public" : "Private"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(list?.meta?.timestamps?.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link
                          href={`/collections/${list.cart_id}`}
                          className="text-brand-primary hover:text-brand-primary/80 p-1 rounded hover:bg-gray-100"
                          title="View"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/shared-lists/${list.cart_id}/edit`}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-gray-100"
                          title="Edit"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEdit(list);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(list)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                          title="Delete"
                          disabled={deletingId === list.cart_id}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteOverlay && deletingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowDeleteOverlay(false)}
              aria-label="Close"
              disabled={deleting}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Delete Shared List</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deletingList.name}</span>? This
                action cannot be undone.
              </p>
              {deleteError && (
                <div className="text-red-600 mb-4">{deleteError}</div>
              )}
              <div className="flex gap-3 justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowDeleteOverlay(false)}
                  disabled={deleting}
                  className="px-6 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Overlay */}
      {showEditOverlay && editingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowEditOverlay(false)}
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Shared List</h2>
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                handleSaveEdit();
              }}
            >
              <label className="block mb-2 font-medium">
                Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full mb-4 focus:ring-brand-primary focus:border-brand-primary"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                disabled={saving}
              />
              <div className="flex items-center mb-4">
                <span className="mr-2">Private</span>
                <button
                  type="button"
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${editIsPublic ? "bg-brand-primary" : "bg-gray-300"}`}
                  onClick={() => setEditIsPublic((v) => !v)}
                  disabled={saving}
                >
                  <span
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${editIsPublic ? "translate-x-4" : ""}`}
                  />
                </button>
                <span className="ml-2">Public</span>
              </div>
              {editError && (
                <div className="text-red-600 mb-2">{editError}</div>
              )}
              <div className="flex gap-2 mt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="py-2 text-sm"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowEditOverlay(false)}
                  disabled={saving}
                  className="py-2 text-sm"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
