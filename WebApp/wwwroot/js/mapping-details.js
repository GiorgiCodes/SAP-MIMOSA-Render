// Display details toggle
function toggleDetails(mapID) {
  // Hide all other open details rows
  document.querySelectorAll(".details-row").forEach((row) => {
    if (row.id !== "details-" + mapID) {
      row.classList.remove("showing")
      setTimeout(() => {
        row.style.display = "none"
      }, 400)
    }
  })

  // Toggle the selected row
  const row = document.getElementById("details-" + mapID)
  if (row && row.style.display === "none") {
    row.style.display = "table-row"
    setTimeout(() => {
      row.classList.add("showing")
    }, 10)
  } else if (row) {
    row.classList.remove("showing")
    setTimeout(() => {
      row.style.display = "none"
    }, 400)
  }
}

// Auto-hide success message
setTimeout(() => {
  var msg = document.getElementById("success-message")
  if (msg) msg.style.display = "none"
}, 5000)
