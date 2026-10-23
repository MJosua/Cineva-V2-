
/**
 * Submit a new entry
 * @param {string} slug 
 * @param {Object} submissionData 
 */
async function submitEntry(slug, { participant_name, participant_contact, receipt_codes, extra_data }) {
    // 1. Get Campaign
    const campaign = await getCampaignBySlug(slug);
    if (!campaign) throw new Error("Campaign not found");
    // if (campaign.status !== 'active') throw new Error("Campaign is not active"); // controller checks this? or we check here.

    // 2. Prepare Data
    const submissionId = crypto.randomUUID();
    const codes = Array.isArray(receipt_codes) ? JSON.stringify(receipt_codes) : JSON.stringify([receipt_codes]);
    const extra = extra_data ? JSON.stringify(extra_data) : '{}';

    // 3. Insert
    const sql = `
        INSERT INTO EVENT_t_submission 
        (submission_id, campaign_id, participant_name, participant_contact, receipt_codes, extra_data, status, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;

    await dbQueryHots(sql, [
        submissionId,
        campaign.campaign_id,
        participant_name,
        participant_contact,
        codes,
        extra
    ]);

    return { submission_id: submissionId, status: 'pending' };
}
