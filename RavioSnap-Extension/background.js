chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startCapture') {
    runCaptureSequence()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

async function runCaptureSequence() {
  const tabs = await chrome.tabs.query({});
  
  // Find tabs by matching URL or Title
  let niftyTab = tabs.find(t => {
    const url = (t.url || '').toLowerCase();
    const title = (t.title || '').toLowerCase();
    return url.includes('nse%3anifty') || url.includes('nifty50') || (title.includes('nifty') && !title.includes('bank'));
  });

  let bankNiftyTab = tabs.find(t => {
    const url = (t.url || '').toLowerCase();
    const title = (t.title || '').toLowerCase();
    return url.includes('nse%3abanknifty') || title.includes('banknifty') || title.includes('bank nifty');
  });

  let optionChainTab = tabs.find(t => {
    const url = (t.url || '').toLowerCase();
    const title = (t.title || '').toLowerCase();
    return url.includes('tv.dhan.co') || title.includes('option') || url.includes('option-chain');
  });
  
  let ravioTab = tabs.find(t => (t.url || '').includes('localhost:3000'));

  if (!niftyTab || !bankNiftyTab || !optionChainTab) {
     throw new Error("Could not find Nifty, BankNifty, or Option Chain tabs. Make sure they are open!");
  }
  if (!ravioTab) {
     throw new Error("Ravio Edge dashboard (localhost:3000) is not open.");
  }

  // Capture each tab
  const niftyImage = await captureTab(niftyTab.windowId, niftyTab.id);
  const bankNiftyImage = await captureTab(bankNiftyTab.windowId, bankNiftyTab.id);
  const optionChainImage = await captureTab(optionChainTab.windowId, optionChainTab.id);

  // Send images to Ravio Edge tab via content script
  try {
    await chrome.tabs.sendMessage(ravioTab.id, {
      action: "injectImages",
      images: {
        nifty: niftyImage,
        bankNifty: bankNiftyImage,
        optionChain: optionChainImage
      }
    });
  } catch (e) {
    console.warn("Could not communicate with Ravio Edge tab. Is the content script loaded?", e);
  }

  // Finally, switch focus back to Ravio Edge tab so user can see it
  try {
    await chrome.windows.update(ravioTab.windowId, { focused: true });
    await chrome.tabs.update(ravioTab.id, { active: true });
  } catch (e) {}
}

async function captureTab(windowId, tabId) {
    // Bring window to front
    await chrome.windows.update(windowId, { focused: true });
    // Switch to tab
    await chrome.tabs.update(tabId, { active: true });
    
    // Wait for the tab to fully render on screen
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Capture
    const dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
    return dataUrl;
}
