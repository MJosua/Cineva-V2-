// approvalHelper.js
function hotsCheckApprovalLevel(ticketId, approvalLevel, team_leader, superiorID, ) {
    const paramInsertApproval = [];

    if (approvalLevel === 1) {
        paramInsertApproval.push([ticketId, 1, team_leader]);
    }
    if (approvalLevel === 2) {
        paramInsertApproval.push([ticketId, 1, superiorID]);
        paramInsertApproval.push([ticketId, 2, team_leader]);
    }
   

    return paramInsertApproval;
}

module.exports = hotsCheckApprovalLevel;
