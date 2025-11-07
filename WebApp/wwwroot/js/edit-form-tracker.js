// Track form modifications and warn on unsaved changes
document.addEventListener("DOMContentLoaded", () => {
  let formModified = false

  // Track form modifications
  document.querySelectorAll("form input, form textarea, form select").forEach((input) => {
    input.addEventListener("change", () => {
      formModified = true
      if (window.recalculateAccuracy) {
        window.recalculateAccuracy()
      }
    })
  })

  // Add warning when navigating away with unsaved changes
  window.addEventListener("beforeunload", (e) => {
    if (formModified) {
      const message = "You have unsaved changes. Are you sure you want to leave?"
      e.returnValue = message
      return message
    }
  })

  // Save changes with confirmation
  document.getElementById("saveChangesBtn")?.addEventListener("click", (e) => {
    e.preventDefault()
    if (confirm("Are you sure you want to save changes to this mapping document?")) {
      document.getElementById("editForm").submit()
    }
  })

  // Expose formModified setter for other modules
  window.setFormModified = (value) => {
    formModified = value
  }
})
