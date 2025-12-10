import React from "react";
import { ArrowRight } from "lucide-react";

/**
 * levels = [
 *   { level: 1, resolver: "direct superior", approver_user: "10" },
 *   { level: 2, resolver: "team leader", approver_user: "22" },
 *   { level: 3, resolver: "direct user", approver_user: "15" }
 * ]
 */

export default function WorkflowFlowchart({ levels = [] }) {
    if (!levels.length) {
        return (
            <div className="p-4 text-center text-gray-500 border rounded bg-gray-50">
                No workflow defined for this service.
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto py-6">
            <div className="flex items-center gap-8">
                {levels.map((step, index) => (
                    <div key={step.level}>
                        {/* Node */}
                        <div className="flex flex-col items-center">
                            <div className="bg-white shadow-md border rounded-xl px-6 py-4 min-w-[180px] text-center">
                                <div className="text-xs text-gray-500">Level {step.level}</div>
                                <div className="font-semibold text-gray-800 capitalize mt-1">
                                    {step.resolver}
                                </div>

                                {step.approver_user ? (
                                    <div className="mt-2 text-sm text-blue-600">
                                        User ID: {step.approver_user}
                                    </div>
                                ) : (
                                    <div className="mt-2 text-sm text-gray-400 italic">
                                        Auto Resolver
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Arrow — only between nodes */}
                        {index < levels.length - 1 && (
                            <ArrowRight className="w-6 h-6 text-gray-500 shrink-0" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
