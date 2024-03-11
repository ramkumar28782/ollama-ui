var rebuildRules = undefined;
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    rebuildRules = async function (domain) {
    const domains = [domain];
    /** @type {chrome.declarativeNetRequest.Rule[]} */
    const rules = [{
      id: 1,
      condition: {
        requestDomains: domains
      },
      action: {
        type: 'modifyHeaders',
        requestHeaders: [{
          header: 'origin',
          operation: 'set',
          value: `http://${domain}`,
        }],
      },
    }];
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules,
    });
  }
}


var ollama_host = localStorage.getItem("host-address");
if (!ollama_host){
  ollama_host = 'http://localhost:11434'
} else {
  document.getElementById("host-address").value = ollama_host;
}

if (rebuildRules){
  rebuildRules(ollama_host);
}

function setHostAddress(){
  ollama_host = document.getElementById("host-address").value;
  localStorage.setItem("host-address", ollama_host);
  populateModels();
  if (rebuildRules){
    rebuildRules(ollama_host);
  }
}



async function getModels(){
  const response = await fetch(`${ollama_host}/api/tags`);
  const data = await response.json();
  return data;
}


// Function to send a POST request to the API
function postRequest(data, signal) {
  const URL = `${ollama_host}/api/generate`;
  return fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
    signal: signal
  });
}

async function getResponse(response, callback) {
 const reader = response.body.getReader();
  let chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }

    const combinedChunks = new Uint8Array(chunks.reduce((acc, val) => acc.concat(Array.from(val)), []));
    const text = new TextDecoder().decode(combinedChunks);
    const parsedResponse = JSON.parse(text);
    let citationsDiv = document.createElement('div');
    citationsDiv.className = 'citations-container';

    // Additionally, process and display citation content from the `source_documents` array
    if (parsedResponse.source_documents && parsedResponse.source_documents.length > 0) {
      console.log("Citations:", parsedResponse);
      parsedResponse.source_documents.forEach((doc, index) => {
            console.log("Citations:", doc);
            console.log("parsedResponse:", parsedResponse);

        let citation = document.createElement('div'); // Fixed variable name to `citation` for clarity
        citation.className = 'citation mb-2';
//        citation.innerHTML = `<div><strong>Citation ${index + 1}:</strong><details class="show-hide-content-wrapper first-show-hide"> ${doc.source}<br>${doc.content}</details></div>`;
        citation.innerHTML = `<details class="show-hide-content-wrapper" data-cid="tcm:182-294717-16" data-ctid="tcm:91-244416-32"><summary class="show-hide-content-title" aria-expanded="false"><span class="show-hide-title-text"><span class="hidden"><strong>Citation ${index + 1}:</strong></span></span></summary><div class="show-hide-content-text-wrapper-collapsible"><div><div class="link-list-desc" data-cid="tcm:84-294709-16" data-ctid="tcm:91-226307-32"><ul><li><strong>Source: ${doc.source}</source> </li><li>${doc.content}</li></ul></div></div></div></details>`;
        parsedResponse.response += citation.innerHTML;
        citationsDiv.appendChild(citation); // Make sure to append `citation`, not `parsedCitations`
      });
    }
  // Assuming the callback is designed to handle the full JSON response:
  callback(parsedResponse);
}