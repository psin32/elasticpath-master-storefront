"use client";

import { useState, useEffect } from "react";
import { Button } from "../../../../../components/button/Button";
import { toast } from "react-toastify";
import { createNoteForOrder } from "../../../../../services/custom-api";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  useAuthedAccountMember,
  useAccountMembers,
} from "../../../../../react-shopper-hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/select/Select";
import { AccountMember } from "@elasticpath/js-sdk";

interface OrderNotesProps {
  orderId: string;
  initialNotes: any[];
  currentUserName: string;
}

export function OrderNotes({
  orderId,
  initialNotes,
  currentUserName,
}: OrderNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAccountMemberId, setSelectedAccountMemberId] = useState<
    string | undefined
  >();

  const {
    data: accountMember,
    selectedAccountToken,
    accountMemberTokens,
  } = useAuthedAccountMember();
  const accountId = selectedAccountToken?.account_id;

  // Show account tags dropdown only when there are multiple accounts
  const hasMultipleAccounts =
    accountMemberTokens && Object.keys(accountMemberTokens).length > 1;

  // Fetch all account members for the selected account
  const { data: accountMembersData, isLoading: isLoadingMembers } =
    useAccountMembers(accountId || "", {
      enabled: !!accountId && !!selectedAccountToken?.token,
    });

  // Extract account members from the response
  let accountMembers: AccountMember[] = [];
  if (Array.isArray(accountMembersData)) {
    accountMembers = accountMembersData as AccountMember[];
  } else if (
    accountMembersData &&
    typeof accountMembersData === "object" &&
    "data" in accountMembersData
  ) {
    const data = (accountMembersData as { data?: AccountMember[] }).data;
    accountMembers = (data as AccountMember[]) || [];
  }

  const hasMultipleMembers = accountMembers.length > 1;

  // Set initial selected account member when account members are loaded
  useEffect(() => {
    if (
      accountMember?.id &&
      !selectedAccountMemberId &&
      accountMembers.length > 0
    ) {
      // Check if logged-in member exists in the list, otherwise use first member
      const loggedInMember = accountMembers.find(
        (member: AccountMember) => member.id === accountMember.id,
      );
      setSelectedAccountMemberId(loggedInMember?.id || accountMembers[0]?.id);
    }
  }, [accountMember?.id, accountMembers, selectedAccountMemberId]);

  // Get the selected account member's name for the note
  const selectedMember =
    accountMembers.find(
      (member: AccountMember) => member.id === selectedAccountMemberId,
    ) || accountMember;
  const noteAuthorName =
    selectedMember?.name || selectedMember?.email || currentUserName;

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createNoteForOrder({
        order_id: orderId,
        note: newNote.trim(),
        added_by: noteAuthorName,
      });

      if (result?.data) {
        // Add the new note to the list
        setNotes([result.data, ...notes]);
        setNewNote("");
        setShowAddForm(false);
        toast.success("Note added successfully");
      } else {
        throw new Error("Failed to create note");
      }
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to add note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full max-w-6xl bg-white/90 rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-brand-primary" />
          <h2 className="text-2xl font-bold text-gray-900">Order Notes</h2>
          {notes.length > 0 && (
            <span className="bg-brand-primary/10 text-brand-primary text-sm font-semibold px-3 py-1 rounded-full">
              {notes.length}
            </span>
          )}
        </div>
        <Button
          variant="primary"
          size="small"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmitNote}
          className="mb-6 p-4 bg-gradient-to-br from-brand-primary/5 to-white border border-brand-primary/20 rounded-xl"
        >
          <label
            htmlFor="newNote"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Add a New Note
          </label>
          {hasMultipleAccounts && hasMultipleMembers && !isLoadingMembers && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Account Member
              </label>
              <Select
                value={selectedAccountMemberId || ""}
                onValueChange={(value) => setSelectedAccountMemberId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account member">
                    {selectedMember
                      ? `${selectedMember.name} (${selectedMember.email})`
                      : "Select account member"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accountMembers.map((member: AccountMember) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-sm text-gray-500">
                          {member.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <textarea
            id="newNote"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your note here..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-y min-h-[100px] text-gray-900"
            maxLength={1000}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              {newNote.length}/1000 characters
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() => {
                  setShowAddForm(false);
                  setNewNote("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="small"
                disabled={isSubmitting || !newNote.trim()}
              >
                {isSubmitting ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No notes yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Add notes to track important information about this order
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note: any, index: number) => (
            <div
              key={note.id || index}
              className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-brand-primary/10">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">
                        Note
                      </span>
                      {note.added_by && (
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-2.5 py-1 rounded-md shadow-sm">
                          <svg
                            className="w-3.5 h-3.5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span className="text-xs font-medium text-blue-700">
                            {note.added_by}
                          </span>
                        </div>
                      )}
                    </div>
                    {(note.meta?.timestamps?.created_at ||
                      note.meta?.timestamps?.updated_at) && (
                      <time className="text-xs text-gray-500 flex items-center gap-1">
                        <svg
                          className="w-3 h-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatDate(
                          note.meta.timestamps.created_at ||
                            note.meta.timestamps.updated_at,
                        )}
                      </time>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap ml-10">
                {note.note}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
