const container = document.getElementById("container");
const addNoteBtn = document.getElementById("addNoteBtn");
let noteData = [];

// Fetch notes from Chrome storage
function fetchNotes() {
  chrome.runtime.sendMessage({ action: "getNotes" }, (response) => {
    noteData = response || [];
    renderNotes();
  });
}

// Save notes to Chrome storage
function saveNotes() {
  chrome.runtime.sendMessage(
    { action: "saveNotes", notes: noteData },
    (response) => {
      if (response.success) {
        console.log("Notes saved successfully!");
      }
    }
  );
}

// Create and display a new note
function createNewNote(content = "", index = null) {
  const noteDiv = document.createElement("div");
  noteDiv.classList.add("note-row");

  noteDiv.innerHTML = `
    <div contenteditable="true" class="note-editor">${content}</div>
    <div class="note-controls">
      <button class="save-note">Save</button>
      <img src="images/trash_red.svg" class="delete-note" />
    </div>
  `;

  const editor = noteDiv.querySelector(".note-editor");
  const saveButton = noteDiv.querySelector(".save-note");
  const deleteButton = noteDiv.querySelector(".delete-note");

  // Save the note
  saveButton.addEventListener("click", () => {
    const noteContent = editor.innerHTML.trim();
    if (index !== null) {
      // Update the existing note
      noteData[index] = noteContent;
    } else if (noteContent && !noteData.includes(noteContent)) {
      // Add a new note if not already present
      noteData.push(noteContent);
    }
    saveNotes();
    renderNotes();
  });

  // Delete the note
  deleteButton.addEventListener("click", () => {
    if (index !== null) {
      noteData.splice(index, 1); // Remove the note from the array
    }
    noteDiv.remove();
    saveNotes();
  });

  container.appendChild(noteDiv);
}

// Render notes from storage
function renderNotes() {
  container.innerHTML = ""; // Clear existing notes
  noteData.forEach((note, index) => createNewNote(note, index));
}

// Add a new note when "New Note" button is clicked
if (addNoteBtn) {
  addNoteBtn.addEventListener("click", () => {
    createNewNote();
  });
}

// Fetch and render notes on page load
fetchNotes();
