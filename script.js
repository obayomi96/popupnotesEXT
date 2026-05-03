const container = document.getElementById("container");
const addNoteBtn = document.getElementById("add-note-btn");
const hideAllBtn = document.getElementById("hide-all-btn");
const hideSelectedBtn = document.getElementById("hide-selected-btn");
const showHiddenBtn = document.getElementById("show-hidden-btn");
let notes = []; // Array of {id, content, position}
let selectedNotes = [];
let hiddenNotes = [];
let draggedNote = null;

// Generate a unique position value for ordering
function generatePosition() {
  return notes.length > 0 ? Math.max(...notes.map(n => n.position)) + 1 : 1;
}

// Fetch notes from Chrome storage
function fetchNotes() {
  chrome.runtime.sendMessage({ action: "getNotes" }, (response) => {
    notes = response?.notes || [];
    // Initialize positions if not present
    notes.forEach((note, index) => {
      if (!note.position) note.position = index + 1;
    });
    // Sort by position to maintain order
    notes.sort((a, b) => a.position - b.position);
    
    hiddenNotes = response?.hiddenNotes || [];
    selectedNotes = response?.selectedNotes || [];
    renderNotes();
    updateButtonStates();
  });
}

// Save notes to Chrome storage
function saveNotes() {
  chrome.runtime.sendMessage(
    { 
      action: "saveNotes", 
      notes: notes,
      hiddenNotes: hiddenNotes,
      selectedNotes: selectedNotes
    },
    (response) => {
      if (response.success) {
        console.log("Notes saved successfully!");
      }
    }
  );
}

// Create and display a new note
function createNewNote(noteObj, isHidden = false, isSelected = false) {
  const noteDiv = document.createElement("div");
  noteDiv.classList.add("note-row");
  if (isHidden) noteDiv.classList.add("hidden");

  noteDiv.innerHTML = `
    <div class="note-header">
      <input type="checkbox" class="note-checkbox" ${
        isSelected ? 'checked' : ''
      } data-note-id="${noteObj.id}">
      <div class="drag-handle" draggable="true">≡</div>
    </div>
    <div class="formatting-toolbar">
      <button class="fmt-btn" data-cmd="bold" title="Bold (Ctrl+B)"><b>B</b></button>
      <button class="fmt-btn" data-cmd="italic" title="Italic (Ctrl+I)"><i>I</i></button>
      <button class="fmt-btn" data-cmd="underline" title="Underline (Ctrl+U)"><u>U</u></button>
      <button class="fmt-btn" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
    </div>
    <div contenteditable="true" class="note-editor">${noteObj.content}</div>
    <div class="note-controls">
      <div class="save-group">
        <button class="save-note" title="Or use ctrl+s">Save</button>
        <span class="auto-save-status"></span>
      </div>
      <img src="images/trash_red.svg" class="delete-note" />
    </div>
  `;

  const editor = noteDiv.querySelector(".note-editor");
  const saveButton = noteDiv.querySelector(".save-note");
  const autoSaveStatus = noteDiv.querySelector(".auto-save-status");
  const deleteButton = noteDiv.querySelector(".delete-note");
  const checkbox = noteDiv.querySelector(".note-checkbox");
  const dragHandle = noteDiv.querySelector(".drag-handle");
  const fmtButtons = noteDiv.querySelectorAll(".fmt-btn");

  function persistNote() {
    const noteContent = editor.innerHTML.trim();
    const noteIndex = notes.findIndex(n => n.id === noteObj.id);
    if (noteIndex !== -1) {
      notes[noteIndex].content = noteContent;
      saveNotes();
    }
  }

  function showAutoSaved() {
    autoSaveStatus.textContent = "Auto-saved";
    autoSaveStatus.classList.add("visible");
    setTimeout(() => autoSaveStatus.classList.remove("visible"), 2000);
  }

  // Formatting toolbar buttons
  fmtButtons.forEach(btn => {
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault(); // keep editor focus
      document.execCommand(btn.dataset.cmd, false, null);
    });
  });

  // Auto-save: 1 second after last keystroke
  let autoSaveTimer = null;
  editor.addEventListener("input", () => {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      persistNote();
      showAutoSaved();
    }, 1000);
  });

  // Save the note
  saveButton.addEventListener("click", () => {
    clearTimeout(autoSaveTimer);
    persistNote();
  });

  // Save with keyboard (Ctrl+S)
  editor.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      clearTimeout(autoSaveTimer);
      persistNote();
    }
  });

  // Delete the note
  deleteButton.addEventListener("click", () => {
    const noteIndex = notes.findIndex(n => n.id === noteObj.id);
    if (noteIndex !== -1) {
      notes.splice(noteIndex, 1);
      hiddenNotes = hiddenNotes.filter(id => id !== noteObj.id);
      selectedNotes = selectedNotes.filter(id => id !== noteObj.id);
    }
    noteDiv.remove();
    saveNotes();
    updateButtonStates();
  });

  // Checkbox selection
  checkbox.addEventListener("change", (e) => {
    if (e.target.checked) {
      if (!selectedNotes.includes(noteObj.id)) {
        selectedNotes.push(noteObj.id);
      }
    } else {
      selectedNotes = selectedNotes.filter(id => id !== noteObj.id);
    }
    saveNotes();
    updateButtonStates();
  });

  // Drag and drop functionality
  dragHandle.addEventListener("dragstart", (e) => {
    draggedNote = noteDiv;
    noteDiv.classList.add("dragging");
    e.dataTransfer.setData("text/plain", noteObj.id);
    e.dataTransfer.effectAllowed = "move";
  });

  dragHandle.addEventListener("dragend", () => {
    noteDiv.classList.remove("dragging");
    draggedNote = null;
  });

  container.appendChild(noteDiv);
  return noteDiv;
}

// Render notes from storage
function renderNotes() {
  container.innerHTML = "";
  // Sort notes by position before rendering
  notes.sort((a, b) => a.position - b.position);
  notes.forEach(note => {
    const isHidden = hiddenNotes.includes(note.id);
    const isSelected = selectedNotes.includes(note.id);
    createNewNote(note, isHidden, isSelected);
  });

  // Set up drag and drop events for the container
  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (!draggedNote) return;
    
    const afterElement = getDragAfterElement(container, e.clientX);
    if (afterElement) {
      container.insertBefore(draggedNote, afterElement);
    } else {
      container.appendChild(draggedNote);
    }
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!draggedNote) return;
    
    const draggedId = e.dataTransfer.getData("text/plain");
    const draggedNoteObj = notes.find(n => n.id === draggedId);
    if (!draggedNoteObj) return;

    // Get all note elements in their new order
    const noteElements = Array.from(container.querySelectorAll(".note-row"));
    
    // Update positions based on new order
    noteElements.forEach((el, newIndex) => {
      const noteId = el.querySelector(".note-checkbox").dataset.noteId;
      const note = notes.find(n => n.id === noteId);
      if (note) {
        note.position = newIndex + 1;
      }
    });
    
    saveNotes();
  });
}

function getDragAfterElement(container, x) {
  const draggableElements = [...container.querySelectorAll('.note-row:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Update button states
function updateButtonStates() {
  hideAllBtn.disabled = notes.length === 0;
  hideSelectedBtn.disabled = selectedNotes.length === 0;
  showHiddenBtn.disabled = hiddenNotes.length === 0;
}

// Hide selected notes
function hideSelectedNotes() {
  selectedNotes.forEach(id => {
    if (!hiddenNotes.includes(id)) {
      hiddenNotes.push(id);
    }
  });
  saveNotes();
  renderNotes();
  updateButtonStates();
}

// Hide all notes
function hideAllNotes() {
  hiddenNotes = notes.map(note => note.id);
  saveNotes();
  renderNotes();
  updateButtonStates();
}

// Show all hidden notes
function showHiddenNotes() {
  hiddenNotes = [];
  saveNotes();
  renderNotes();
  updateButtonStates();
}

// Event listeners for buttons
addNoteBtn.addEventListener("click", () => {
  const newNote = {
    id: Date.now().toString(),
    content: "",
    position: generatePosition()
  };
  notes.push(newNote);
  createNewNote(newNote);
  saveNotes();
  updateButtonStates();
});

hideSelectedBtn.addEventListener("click", hideSelectedNotes);
hideAllBtn.addEventListener("click", hideAllNotes);
showHiddenBtn.addEventListener("click", showHiddenNotes);

// Initialize
fetchNotes();
