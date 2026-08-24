"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export type Domain = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  total_subtopics?: number;
  completed_subtopics?: number;
  progress_percentage?: number;
};

type ModalMode = "create" | "edit" | "delete" | null;

const btn =
  "inline-flex items-center justify-center border-2 border-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide shadow-[3px_3px_0_#000] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000] disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs";

function authHeaders() {
  const accessToken =
    typeof window !== "undefined"
      ? sessionStorage.getItem("adminAccessToken")
      : null;
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function AdminDomainsPanel() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Domain | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchDomains = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/domains`,
        { headers: authHeaders() }
      );
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to load domains.");
      }

      setDomains(
        Array.isArray(result?.data?.domains) ? result.data.domains : []
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to fetch domains."
      );
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  function openCreate() {
    setSelected(null);
    setNameInput("");
    setModalError("");
    setModalMode("create");
  }

  function openEdit(domain: Domain) {
    setSelected(domain);
    setNameInput(domain.name);
    setModalError("");
    setModalMode("edit");
  }

  function openDelete(domain: Domain) {
    setSelected(domain);
    setModalError("");
    setModalMode("delete");
  }

  function closeModal() {
    if (isSaving) return;
    setModalMode(null);
    setSelected(null);
    setNameInput("");
    setModalError("");
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const name = nameInput.trim();
    if (!name) {
      setModalError("Domain name is required.");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      const isEdit = modalMode === "edit" && selected;
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/domains/${selected.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/domains`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name }),
      });
      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message ||
            (isEdit ? "Failed to update domain." : "Failed to create domain.")
        );
      }

      setModalMode(null);
      setSelected(null);
      setNameInput("");
      await fetchDomains();
    } catch (error) {
      setModalError(
        error instanceof Error ? error.message : "Unable to save domain."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;

    setIsSaving(true);
    setModalError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/domains/${selected.id}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to delete domain.");
      }

      setModalMode(null);
      setSelected(null);
      await fetchDomains();
    } catch (error) {
      setModalError(
        error instanceof Error ? error.message : "Unable to delete domain."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-black">
            Domains
          </h2>
          <p className="mt-1 text-sm text-black/65">
            Create, edit, and delete subject domains.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className={`${btn} bg-[#1D4ED8] text-white`}
        >
          + Add domain
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-black/65">Loading domains...</p>
      ) : errorMessage ? (
        <div className="space-y-3">
          <p className="text-sm text-[#DC2626]">{errorMessage}</p>
          <button type="button" onClick={fetchDomains} className={`${btn} bg-white`}>
            Retry
          </button>
        </div>
      ) : domains.length === 0 ? (
        <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0_#000]">
          <p className="text-sm text-black/70">No domains yet. Add your first one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-black bg-white shadow-[4px_4px_0_#000]">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-black bg-[#F2F0E4]">
                {["Name", "Subtopics", "Updated", ""].map((col) => (
                  <th
                    key={col || "actions"}
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide sm:text-xs"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr
                  key={domain.id}
                  role="link"
                  tabIndex={0}
                  onClick={() =>
                    router.push(
                      `/admin/dashboard/teir?domainId=${encodeURIComponent(domain.id)}`
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(
                        `/admin/dashboard/teir?domainId=${encodeURIComponent(domain.id)}`
                      );
                    }
                  }}
                  className="cursor-pointer border-b border-black/15 transition hover:bg-[#FFF7D6] last:border-b-0"
                >
                  <td className="px-4 py-3 text-sm font-semibold text-black">
                    {domain.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-black">
                    {domain.total_subtopics ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-black/70">
                    {formatDate(domain.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex flex-wrap justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => openEdit(domain)}
                        className={`${btn} bg-white`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(domain)}
                        className={`${btn} bg-[#DC2626] text-white`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalMode ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md border-2 border-black bg-white p-5 shadow-[8px_8px_0_#000] sm:p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {modalMode === "delete" ? (
              <>
                <h3 className="text-lg font-extrabold uppercase text-black">
                  Delete domain
                </h3>
                <p className="mt-3 text-sm text-black/75">
                  Delete{" "}
                  <span className="font-bold text-black">{selected?.name}</span>?
                  This cannot be undone.
                </p>
                {modalError ? (
                  <p className="mt-3 text-sm text-[#DC2626]">{modalError}</p>
                ) : null}
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSaving}
                    className={`${btn} bg-white`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className={`${btn} bg-[#DC2626] text-white`}
                  >
                    {isSaving ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <h3 className="text-lg font-extrabold uppercase text-black">
                  {modalMode === "create" ? "Add domain" : "Edit domain"}
                </h3>
                <label className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-black">
                  Name
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Software"
                    autoFocus
                    className="mt-1.5 h-11 w-full border-2 border-black px-3 text-sm outline-none focus:bg-[#FFF7D6]"
                  />
                </label>
                {modalError ? (
                  <p className="mt-3 text-sm text-[#DC2626]">{modalError}</p>
                ) : null}
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSaving}
                    className={`${btn} bg-white`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`${btn} bg-[#1D4ED8] text-white`}
                  >
                    {isSaving
                      ? "Saving..."
                      : modalMode === "create"
                        ? "Create"
                        : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
