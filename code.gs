// --- START OF CONFIGURATION ---jyyejyj
// Fill in your Inkeep credentials here. They will be stored securely on the server.
const INKEEP_CONFIG = {
  tenantId: 'winternal',
  projectId: 'Librarian Documentation Assistant',
  graphId: 'librarian-graph',
  apiKey: 'YOUR_API_KEY' 
  // For better security, consider storing apiKey in Script Properties.
};
// --- END OF CONFIGURATION ---

/**
 * Serves the main HTML page of the web app.
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Documentation Assistant')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Includes other HTML files (like CSS or JS) into the main page.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Acts as a secure server-side proxy to call the Inkeep API.
 * This function now uses the INKEEP_CONFIG constant defined above.
 * @param {string} message The user's chat message.
 * @param {string[]} urls An array of documentation URLs.
 * @returns {Object} An object with either the content or an error message.
 */
function callInkeepAPIProxy(message, urls) {
  const { tenantId, projectId, graphId, apiKey } = INKEEP_CONFIG;

  const inkeepApiUrl = `https://api.inkeep.com/tenants/${tenantId}/projects/${projectId}/graphs/${graphId}/v1/chat/completions`;

  const requestBody = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a helpful documentation assistant. The user has provided these documentation URLs: ${urls.join(', ')}. Help them with code generation and questions based on this documentation.`
      },
      {
        role: "user",
        content: message
      }
    ],
    stream: false,
  };

  const options = {
    'method': 'POST',
    'contentType': 'application/json',
    'headers': {
      'Authorization': `Bearer ${apiKey}`
    },
    'payload': JSON.stringify(requestBody),
    'muteHttpExceptions': true
  };

  try {
    const response = UrlFetchApp.fetch(inkeepApiUrl, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode >= 200 && responseCode < 300) {
      const data = JSON.parse(responseBody);
      if (data.choices && data.choices.length > 0) {
        return { content: data.choices[0].message.content };
      }
      return { content: "No response received from the assistant." };
    } else {
      return { error: `API Error (${responseCode}): ${responseBody}` };
    }
  } catch (e) {
    return { error: `Script Error: ${e.toString()}` };
  }
}
