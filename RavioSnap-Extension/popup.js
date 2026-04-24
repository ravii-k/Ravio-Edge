document.getElementById('captureBtn').addEventListener('click', () => {
  const statusEl = document.getElementById('status');
  statusEl.innerText = "Scanning tabs...";
  statusEl.style.color = "#3b82f6";
  
  chrome.runtime.sendMessage({ action: 'startCapture' }, (response) => {
    if (response && response.success) {
      statusEl.innerText = "Sent to Ravio Edge!";
      statusEl.style.color = "#10b981";
    } else {
      statusEl.innerText = "Error: " + (response?.error || "Unknown");
      statusEl.style.color = "#ef4444";
    }
  });
});
