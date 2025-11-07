// CSV Import functionality
document.addEventListener("DOMContentLoaded", () => {
  const importCsvBtn = document.getElementById("importCsvBtn")
  const fileInput = document.getElementById("csvFileInput")
  const labelSpan = document.getElementById("csvLabel")
  const importLoading = document.getElementById("importLoading")

  // Import CSV button handler
  if (importCsvBtn) {
    importCsvBtn.addEventListener("click", (event) => {
      event.preventDefault()

      if (!fileInput.files.length) {
        importLoading.innerHTML = '<div class="alert alert-danger">Please select a CSV file.</div>'
        return
      }

      const formData = new FormData()
      formData.append("csvFile", fileInput.files[0])
      importLoading.innerHTML =
        '<div class="spinner-border text-success" role="status"><span class="visually-hidden"></span></div>'

      fetch("/Home/ImportCsv", { method: "POST", body: formData })
        .then((resp) => (resp.ok ? resp.json() : Promise.reject("Failed to import CSV.")))
        .then((data) => {
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl
          } else {
            alert("Invalid response from server.")
          }
        })
        .catch((error) => alert("Error importing CSV: " + error))
    })
  }

  // Display file name of imported file
  if (fileInput && labelSpan) {
    fileInput.addEventListener("change", function () {
      const labelText = document.getElementById("csvLabelText")
      if (this.files.length > 0) {
        if (labelText) {
          labelText.textContent = this.files[0].name
        }
        labelSpan.title = this.files[0].name
      } else {
        if (labelText) {
          labelText.textContent = "Choose CSV"
        }
        labelSpan.title = ""
      }
    })
  }
})
