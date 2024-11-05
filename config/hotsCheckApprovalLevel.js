function hotsCheckApprovalLevel(ticketId, approvalLevel, team_leader, superiorID) {
    const paramInsertApproval = [];

    if (approvalLevel === 1) {
        team_leader.forEach(user_id => {
            paramInsertApproval.push([ticketId, 1, user_id]);
        });
    }
    if (approvalLevel === 2) {
        paramInsertApproval.push([ticketId, 1, superiorID]);
        team_leader.forEach((user_id,index) => {
            paramInsertApproval.push([ticketId, (index+2), user_id]);
        });
    }
    if (approvalLevel === 3) {
        team_leader.forEach((user_id,idx) => {
            paramInsertApproval.push([ticketId, (idx+1), user_id]);
        });
    }

    return paramInsertApproval;
}

module.exports = hotsCheckApprovalLevel;