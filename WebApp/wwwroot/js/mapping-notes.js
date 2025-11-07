// Toggle notes functionality
function toggleNotes(mapID) {
  const currentNote = document.getElementById("notesCollapse-" + mapID)
  const currentArrow = document.getElementById("notesArrow-" + mapID)
  const isOpen = currentNote?.classList.contains("open")

  // Close all notes and reset arrows
  document.querySelectorAll(".notes-row").forEach((row) => {
    row.style.maxHeight = "0"
    row.classList.remove("open")
  })
  document.querySelectorAll(".note-icon").forEach((arrow) => {
    arrow.classList.remove("rotated")
  })

  // Open current note
  if (!isOpen && currentNote) {
    currentNote.classList.add("open")
    currentNote.style.maxHeight = currentNote.scrollHeight + "px"
    currentArrow?.classList.add("rotated")
  }
}
