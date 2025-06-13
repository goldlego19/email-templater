import api, { route } from "@forge/api";

export async function run(event) {
  //issue information from event
  const issue = event.issue;
  const issueKey = issue.key;
  const summary = issue.fields.summary;

  const baseUrl = await getJiraBaseUrl();

  //HTML Template
  const bodyData = {
    htmlBody: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Issue Notification</title>
  </head>
  <body style="margin:0; padding:0; background-color:#fafafa;">
    <!--[if !gte mso 9]><span style="display:none;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;visibility:hidden;mso-hide:all">A new Jira issue has been created.</span><!--<![endif]-->
    <center>
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fafafa" style="background-color:#fafafa;">
        <tr>
          <td align="center" valign="top" style="padding:20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="width:600px; background-color:#fff; border-radius:8px; border:1px solid #eaeaea;">
              <!-- Header -->
              <tr>
                <td align="center" style="padding:0 30px 12px 30px;">
                  <h1 style="font-family:Arial, Helvetica, sans-serif; color:#002050; font-size:22px; margin:0; font-weight:bold; text-align:center;">
                    🚀 Issue Created: ${issueKey}
                  </h1>
                  <p style="font-family:Arial, Helvetica, sans-serif; color:#202020; font-size:16px; margin:8px 0 0 0; text-align:center;">
                    <strong>${summary}</strong>
                  </p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td align="center" style="padding:24px 30px 24px 30px;">
                  <p style="font-family:Arial, Helvetica, sans-serif; color:#000; font-size:15px; margin:0; text-align:center;">
                    A new Jira issue has been created in your project.
                  </p>
                </td>
              </tr>
              <!-- Button -->
              <tr>
                <td align="center" style="padding:0 0 24px 0;">
                  <a href="${baseUrl}/browse/${issueKey}" target="_blank"
                    style="display:inline-block; background-color:#002050; color:#fff; font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:bold; text-decoration:none; padding:14px 32px; border-radius:30px;">
                    View Request
                  </a>
                </td>
              </tr>
              <!-- Footer -->
        
            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>
`,
    subject: `🚀 Issue Updated: ${issueKey}`,
    textBody: `A Jira issue has an update.\nSummary: ${summary}\nView it at: https://support.onpointserv.com/portal/6/${issueKey}`,
    to: {
      assignee: true,
      reporter: true,
      voters: true,
      watchers: true,
    },
  };

  try {
    //JIRA Endpoint
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

//Gets Base URL
async function getJiraBaseUrl() {
  const res = await api.asApp().requestJira(route`/rest/api/3/serverInfo`);
  const data = await res.json();
  return data.baseUrl; // e.g. https://your-domain.atlassian.net
}
