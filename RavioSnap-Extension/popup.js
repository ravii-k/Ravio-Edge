document.getElementById('captureBtn').addEventListener('click', (e) => {
  const btn = e.target;
  const statusEl = document.getElementById('status');
  
  btn.disabled = true;
  statusEl.innerText = "Scanning tabs...";
  statusEl.style.color = "#3b82f6";
  
  chrome.runtime.sendMessage({ action: 'startCapture' }, (response) => {
    btn.disabled = false;
    if (response && response.success) {
      statusEl.innerText = "Sent to Ravio Edge!";
      statusEl.style.color = "#10b981";
    } else {
      statusEl.innerText = "Error: " + (response?.error || "Unknown");
      statusEl.style.color = "#ef4444";
    }
  });
});
