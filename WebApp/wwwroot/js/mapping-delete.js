// Delete mapping functionality
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const mapID = this.getAttribute("data-mapid")
      if (!confirm("Are you sure you want to delete this mapping document?")) return

      // Get the base URL from the page (you may need to adjust this)
      const deleteUrl = "/Home/Delete/" + mapID

      fetch(deleteUrl, {
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Remove the mapping card
            document.getElementById("group-" + mapID)?.remove()

            // Show success message
            const successMsg = document.createElement("div")
            successMsg.className = "alert alert-success"
            successMsg.textContent = "Mapping deleted successfully"
            document
              .querySelector(".container")
              ?.insertBefore(successMsg, document.querySelector(".container").firstChild)

            // Auto-hide after 5 seconds
            setTimeout(() => {
              successMsg.remove()
            }, 5000)
          } else {
            alert(data.message || "Failed to delete mapping.")
          }
        })
        .catch((err) => {
          alert("Error deleting mapping: " + err)
        })
    })
  })
})
