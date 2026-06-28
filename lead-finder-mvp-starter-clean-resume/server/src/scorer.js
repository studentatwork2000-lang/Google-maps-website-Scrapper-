export function scoreLead(lead) {
  const hasWebsite = Boolean(String(lead.website || '').trim());
  const hasPhone = Boolean(String(lead.phone || '').trim());
  const reviewCount = Number(lead.reviewCount || 0);
  const rating = Number(lead.rating || 0);

  if (!hasWebsite && reviewCount >= 50 && rating >= 4) {
    return {
      leadStatus: 'Strong Gold',
      leadReason: 'No website listed, strong rating/review count. High-priority website sales lead.'
    };
  }

  if (!hasWebsite) {
    return {
      leadStatus: 'Gold',
      leadReason: 'No website listed. Good outreach target.'
    };
  }

  if (!hasPhone && reviewCount < 10) {
    return {
      leadStatus: 'Weak',
      leadReason: 'Website exists, phone missing, and low review count.'
    };
  }

  return {
    leadStatus: 'Low priority / Has website',
    leadReason: 'Website listed on Google Maps. Lower priority for website sales outreach.'
  };
}
