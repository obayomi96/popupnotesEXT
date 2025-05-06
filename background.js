chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getNotes") {
    chrome.storage.local.get(["noteData", "hiddenNotes", "selectedNotes"], (result) => {
      sendResponse({
        notes: result.noteData || [],
        hiddenNotes: result.hiddenNotes || [],
        selectedNotes: result.selectedNotes || []
      });
    });
    return true;
  }

  if (request.action === "saveNotes") {
    chrome.storage.local.set({
      noteData: request.notes,
      hiddenNotes: request.hiddenNotes,
      selectedNotes: request.selectedNotes
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
