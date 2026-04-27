chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'injectImages') {
    // I am sending the payload to the global window so my React app can pick it up
    window.postMessage({
      type: "RAVIO_EXTENSION_IMAGES",
      images: request.images
    }, "*");
    sendResponse({ received: true });
  }
});
