chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'injectImages') {
    // Dispatch the payload into the global window object so the React app can intercept it
    window.postMessage({
      type: "RAVIO_EXTENSION_IMAGES",
      images: request.images
    }, "*");
    sendResponse({ received: true });
  }
});
