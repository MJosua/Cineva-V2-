import React, { useState, useMemo } from "react";

interface TicketApprovalSectionProps {
    ticket: any;
    events: any[];
    user: any;
    refresh: () => void;
    API_URL: string;
}

export default function TicketApprovalSection({
    ticket,
    events,
    user,
    refresh,
    API_URL,
}: TicketApprovalSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [actionType, setActionType] = useState<"approve" | "reject">("approve");
    const [note, setNote] = useState("");

    /* ============================================================
       GROUP EVENTS BY LEVEL
    ============================================================ */
    const groupedLevels = useMemo(() => {
        const groups: any = {};
        events.forEach((e) => {
            if (!groups[e.approval_order]) groups[e.approval_order] = [];
            groups[e.approval_order].push(e);
        });
        return Object.values(groups);
    }, [events]);

    /* ============================================================
       DETERMINE ROLES
    ============================================================ */
    const isCreator = ticket.creator_id === user?.user_id;
    const isApprover = events.some((e) => e.actor_id === user?.user_id);

    /* ============================================================
       HELPER: CHOOSE TEAM LEADER (FIRST MEMBER)
       Replace with real leader logic if needed
    ============================================================ */
    function getTeamLeader(group: any[]) {
        return group[0];
    }

    /* ============================================================
       GET PENDING GROUP + EVENT FOR ACTION BUTTONS
    ============================================================ */
    const pendingGroup = groupedLevels.find((group: any[]) =>
        group.some((ev) => ev.status === "waiting")
    );

    const pendingEvent = pendingGroup?.find((ev) => ev.status === "waiting");
    const isMyTurn = pendingGroup?.some((ev) => ev.actor_id === user?.user_id);

    /* ============================================================
       STATUS COLOR
    ============================================================ */
    const statusColor = (s: string) => {
        switch (s) {
            case "pending":
                return "bg-yellow-200 text-yellow-800";
            case "approved":
                return "bg-green-200 text-green-800";
            case "rejected":
                return "bg-red-200 text-red-800";
            case "completed":
                return "bg-blue-200 text-blue-800";
            case "waiting":
                return "bg-purple-200 text-purple-800";
            default:
                return "bg-gray-200 text-gray-800";
        }
    };

    /* ============================================================
       SUBMIT APPROVE / REJECT
    ============================================================ */
    const submitAction = async () => {
        try {
            const endpoint =
                actionType === "approve" ? "/approve" : "/reject";

            const payload = {
                ticket_id: ticket.ticket_id,
                approver_id: user.user_id,
                note,
            };


            const token = localStorage.getItem("hots_tokek");



            const res = await fetch(`${API_URL}/engine${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (json.ok) {
                alert(
                    actionType === "approve"
                        ? json.final
                            ? "Ticket fully approved."
                            : "Moved to next approver."
                        : "Ticket rejected."
                );
                setIsOpen(false);
                setNote("");
                refresh();
            } else {
                alert(json.error || "Failed to process.");
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    /* ============================================================
       RENDER
    ============================================================ */
    return (
        <div className="mt-8 p-6 border rounded-lg shadow bg-white">
            <h2 className="text-xl font-bold mb-4">Approval Progress</h2>

            {/* APPROVAL LEVELS */}
            <div className="space-y-6">
                {groupedLevels.map((group: any[], idx: number) => {
                    const level = group[0].approval_order;

                    // team leader for this group
                    const leader = getTeamLeader(group);

                    // show only leader for creator
                    const listToShow = isCreator ? [leader] : group;

                    return (
                        <div key={idx} className="border rounded-md p-3 bg-gray-50">
                            <h3 className="font-semibold text-sm mb-2">
                                Level {level}
                            </h3>

                            <div className="space-y-3">
                                {listToShow.map((ev) => (
                                    <div
                                        key={ev.event_id}
                                        className="p-3 border rounded bg-white"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="font-medium">
                                                {ev.actor_id || (
                                                    <span className="italic">Auto / System</span>
                                                )}
                                            </div>

                                            <span
                                                className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(
                                                    ev.status
                                                )}`}
                                            >
                                                {ev.status}
                                            </span>
                                        </div>

                                        {ev.note && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                <strong>Note:</strong> {ev.note}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <hr className="my-6" />

            {/* ACTION BUTTONS */}
            {isMyTurn ? (
                <div className="flex gap-4">
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={() => {
                            setActionType("approve");
                            setIsOpen(true);
                        }}
                    >
                        Approve
                    </button>

                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={() => {
                            setActionType("reject");
                            setIsOpen(true);
                        }}
                    >
                        Reject
                    </button>
                </div>
            ) : ticket.status === "approved" ? (
                <span className="px-3 py-1 bg-green-200 text-green-800 rounded text-sm font-medium">
                    Ticket Fully Approved
                </span>
            ) : (
                <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded text-sm font-medium">
                    Waiting for other approvers
                </span>
            )}

            {/* MODAL */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-bold mb-2">
                            {actionType === "approve"
                                ? "Approve Ticket"
                                : "Reject Ticket"}
                        </h3>

                        <label className="block mb-2 text-sm">Add a note (optional)</label>
                        <textarea
                            className="w-full border rounded p-2 h-28"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Write your message…"
                        />

                        <div className="flex justify-end mt-4 gap-2">
                            <button
                                className="px-4 py-2 border rounded hover:bg-gray-100"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className={`px-4 py-2 text-white rounded ${actionType === "approve"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                    }`}
                                onClick={submitAction}
                            >
                                {actionType === "approve" ? "Approve" : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
