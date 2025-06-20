import api, { route } from "@forge/api";

type SupportedEvent =
  | "avi:jira:created:issue"
  | "avi:jira:updated:issue"
  | "avi:jira:deleted:issue"
  | "avi:jira:assigned:issue"
  | "avi:jira:viewed:issue"
  | "avi:jira:mentioned:issue";

const eventLabels: Record<SupportedEvent, { icon: string; label: string }> = {
  "avi:jira:created:issue": { icon: "🚀", label: "Issue Created" },
  "avi:jira:updated:issue": { icon: "✏️", label: "Issue Updated" },
  "avi:jira:deleted:issue": { icon: "🗑️", label: "Issue Deleted" },
  "avi:jira:assigned:issue": { icon: "👤", label: "Issue Assigned" },
  "avi:jira:viewed:issue": { icon: "👁️", label: "Issue Viewed" },
  "avi:jira:mentioned:issue": { icon: "💬", label: "You Were Mentioned" },
};

const bodyMessages: Record<
  SupportedEvent,
  (issueKey: string, summary: string) => string
> = {
  "avi:jira:created:issue": (issueKey, summary) =>
    `A new Jira issue <b>${issueKey}</b> has been created.<br><b>Summary:</b> ${summary}`,
  "avi:jira:updated:issue": (issueKey, summary) =>
    `Jira issue <b>${issueKey}</b> has been updated.<br><b>Summary:</b> ${summary}`,
  "avi:jira:deleted:issue": (issueKey, summary) =>
    `Jira issue <b>${issueKey}</b> has been deleted.<br><b>Summary:</b> ${summary}`,
  "avi:jira:assigned:issue": (issueKey, summary) =>
    `Jira issue <b>${issueKey}</b> has been assigned.<br><b>Summary:</b> ${summary}`,
  "avi:jira:viewed:issue": (issueKey, summary) =>
    `Jira issue <b>${issueKey}</b> was viewed.<br><b>Summary:</b> ${summary}`,
  "avi:jira:mentioned:issue": (issueKey, summary) =>
    `You were mentioned on Jira issue <b>${issueKey}</b>.<br><b>Summary:</b> ${summary}`,
};

export async function handleIssueEvent(event: any) {
  const eventType: SupportedEvent = event?.eventType || event?.webhookEvent;

  // Skip 'updated' if it's also an assign, mention, etc.
  if (eventType === "avi:jira:updated:issue") {
    if (event.changelog && event.changelog.items) {
      const changedFields = event.changelog.items.map((item: any) =>
        (item.field || "").toLowerCase()
      );
      // Skip if only 'assignee' or 'comment' (any case) was changed
      if (
        changedFields.length === 1 &&
        (changedFields[0] === "assignee" || changedFields[0] === "comment")
      ) {
        console.log("Skipping generic update for assignee or comment change.");
        return {
          skipped: true,
          reason: "Handled by more specific event or not needed",
        };
      }
    }
  }

  if (eventType === "avi:jira:deleted:issue") {
    console.log("Issue was deleted. Skipping notify API.");
    return { skipped: true, reason: "Issue deleted" };
  }

  const labelObj = eventLabels[eventType] || {
    icon: "❓",
    label: "Issue Event",
  };

  // Try to extract issue info safely
  const issue = event.issue || {};
  const issueKey = issue.key || "Unknown";
  const summary = issue.fields?.summary || "No summary";
  const baseUrl = await getJiraBaseUrl();

  // Compose subject and body based on event type
  const subject = `${labelObj.icon} ${labelObj.label}: ${issueKey}`;
  const textBody = `${labelObj.label}.\nSummary: ${summary}\nView it at: ${baseUrl}/browse/${issueKey}`;

  const bodyMessage = (
    bodyMessages[eventType] || (() => "Jira issue event occurred.")
  )(issueKey, summary);

  const bodyData = {
    htmlBody: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${labelObj.label}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#fafafa;">
    <center>
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fafafa" style="background-color:#fafafa;">
        <tr>
          <td align="center" valign="top" style="padding:20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="width:600px; background-color:#fff; border-radius:8px; border:1px solid #eaeaea;">
              <tr>
                <td align="center" style="padding:0 30px 12px 30px;">
                  <h1 style="font-family:Arial, Helvetica, sans-serif; color:#002050; font-size:22px; margin:0; font-weight:bold; text-align:center;">
                    ${labelObj.icon} ${labelObj.label}: ${issueKey}
                  </h1>
                  <p style="font-family:Arial, Helvetica, sans-serif; color:#202020; font-size:16px; margin:8px 0 0 0; text-align:center;">
                    <strong>${summary}</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:24px 30px 24px 30px;">
                  <p style="font-family:Arial, Helvetica, sans-serif; color:#000; font-size:15px; margin:0; text-align:center;">
                    ${bodyMessage}
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:0 0 24px 0;">
                  <a href="${baseUrl}/browse/${issueKey}" target="_blank"
                    style="display:inline-block; background-color:#002050; color:#fff; font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:bold; text-decoration:none; padding:14px 32px; border-radius:30px;">
                    View Issue
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>
`,
    subject,
    textBody,
    to: {
      assignee: true,
      reporter: true,
      voters: true,
      watchers: true,
    },
  };

  try {
    const res = await api
      .asApp()
      .requestJira(route`/rest/api/3/issue/${issueKey}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(bodyData),
      });

    let result;
    try {
      const text = await res.text();
      result = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.warn("Response had no JSON body.");
      result = {};
    }

    console.log("Notify response:", result);
  } catch (err) {
    console.error("Failed to send notification:", err);
  }

  return { success: true };
}

export async function run(event: any) {
  return await handleIssueEvent(event);
}

async function getJiraBaseUrl() {
  const res = await api.asApp().requestJira(route`/rest/api/3/serverInfo`);
  const data = await res.json();
  return data.baseUrl;
}
