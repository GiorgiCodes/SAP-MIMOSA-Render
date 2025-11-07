// Search form functionality
function updateSearchInputName() {
  const searchType = document.querySelector('input[name="SearchType"]:checked').value
  const searchInput = document.getElementById("searchInput")
  const label = document.getElementById("search-label")
  searchInput.removeAttribute("name")
  if (searchType === "EntityName") {
    searchInput.name = "SearchByEntityName"
    label.innerHTML = '<i class="bi bi-search me-1"></i> Enter entity name...'
  } else {
    searchInput.name = "SearchByLLM"
    label.innerHTML = '<i class="bi bi-search me-1"></i> Enter LLM type...'
  }
}

function showInputError(inputElem, errorElem, message) {
  errorElem.textContent = message
  errorElem.style.display = "block"
  inputElem.classList.add("is-invalid")
}

function clearInputError(inputElem, errorElem) {
  errorElem.textContent = ""
  errorElem.style.display = "none"
  inputElem.classList.remove("is-invalid")
}

// Initialize search form
document.addEventListener("DOMContentLoaded", () => {
  // Update placeholder when radio changes
  document.getElementById("searchEntityName")?.addEventListener("change", updateSearchInputName)
  document.getElementById("searchLLMType")?.addEventListener("change", updateSearchInputName)
  updateSearchInputName()

  // Input name on submit
  document.getElementById("mappingSearchForm")?.addEventListener("submit", (e) => {
    updateSearchInputName()
    const searchInput = document.getElementById("searchInput")
    const errorElem = document.getElementById("searchInputError")
    clearInputError(searchInput, errorElem)
    if (!searchInput.value.trim()) {
      showInputError(searchInput, errorElem, "Please enter a search value.")
      e.preventDefault()
      return false
    }
  })

  // Set radio button based on which field is filled
  const searchInput = document.getElementById("searchInput")
  if (searchInput?.value && !document.getElementById("searchLLMType").checked) {
    document.getElementById("searchEntityName").checked = true
  } else if (searchInput?.value && document.getElementById("searchLLMType").checked) {
    document.getElementById("searchLLMType").checked = true
  }
})
