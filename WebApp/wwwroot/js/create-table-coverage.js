// Table coverage UI interactions
document.addEventListener("DOMContentLoaded", () => {
  // Table coverage chevron icon handler
  const collapseEl = document.getElementById("coverageDetails")
  const icon = document.getElementById("chevronIcon")

  if (collapseEl && icon) {
    collapseEl.addEventListener("show.bs.collapse", () => {
      icon.style.transform = "rotate(90deg)"
    })
    collapseEl.addEventListener("hide.bs.collapse", () => {
      icon.style.transform = "rotate(0deg)"
    })
  }

  // Table coverage: set the hidden input if missingFields exists
  // This will be populated by the server-side Razor code
  const missingFieldsData = window.missingFieldsData
  if (missingFieldsData && missingFieldsData !== null && Object.keys(missingFieldsData).length > 0) {
    const hiddenInput = document.getElementById("missingFieldsJson")
    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(missingFieldsData)
    }
  }
})
