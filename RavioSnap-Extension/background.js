chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startCapture') {
    runCaptureSequence()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; 
  }
});

async function runCaptureSequence() {
  const tabs = await chrome.tabs.query({});
  
  let niftyTab = tabs.find(t => {
    const url = (t.url || '').toLowerCase();
    return url.includes('tradingview.com') && url.includes('symbol=nse%3anifty');
  });

  let bankNiftyTab = tabs.find(t => {
    const url = (t.url || '').toLowerCase();
    return url.includes('tradingview.com') && url.includes('symbol=nse%3abanknifty');
  });

  let optionChainTab = tabs.find(t => {
    const url = (t.url || '').toLowerCase();
    return url.includes('tv.dhan.co');
  });
  
  let ravioTab = tabs.find(t => (t.url || '').includes('localhost:3000'));

  if (!niftyTab || !bankNiftyTab || !optionChainTab) {
     throw new Error("I could not find the Nifty, BankNifty, or Option Chain tabs. Please ensure they are all open!");
  }
  if (!ravioTab) {
     throw new Error("I noticed the Ravio Edge dashboard (localhost:3000) is not open.");
  }

  const niftyImage = await captureTab(niftyTab.windowId, niftyTab.id);
  const bankNiftyImage = await captureTab(bankNiftyTab.windowId, bankNiftyTab.id);
  const optionChainImage = await captureTab(optionChainTab.windowId, optionChainTab.id);

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
    console.warn("I could not communicate with the Ravio Edge tab. Is the content script loaded?", e);
  }

  try {
    await chrome.windows.update(ravioTab.windowId, { focused: true });
    await chrome.tabs.update(ravioTab.id, { active: true });
  } catch (e) {}
}

async function captureTab(windowId, tabId) {
    await chrome.windows.update(windowId, { focused: true });
    await chrome.tabs.update(tabId, { active: true });
    
    // I am waiting for the tab to fully render on screen
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
    return dataUrl;
}
