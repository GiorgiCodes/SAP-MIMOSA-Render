// Manage mapping pairs: add, remove, renumber
document.addEventListener("DOMContentLoaded", () => {
  let mappingIndex = Number.parseInt(document.getElementById("mappingsContainer")?.dataset.initialCount || "0")
  const mappingsContainer = document.getElementById("mappingsContainer")
  const noMappingsMessage = document.getElementById("noMappingsMessage")
  const template =
    document.getElementById("mappingPairTemplate")?.textContent ||
    document.getElementById("mappingPairTemplate")?.innerHTML ||
    ""

  // Add mapping button handler
  document.getElementById("addMapping")?.addEventListener("click", () => {
    addMappingPair()
    renumberMappings()
    if (window.setFormModified) window.setFormModified(true)
    if (window.recalculateAccuracy) window.recalculateAccuracy()
  })

  // Attach remove handler to all existing mapping pairs
  document.querySelectorAll(".mapping-pair").forEach(attachRemoveHandler)

  // Function to attach remove handler to a mapping pair element
  function attachRemoveHandler(el) {
    const removeBtn = el.querySelector(".remove-mapping")
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        el.remove()
        renumberMappings()
        if (window.setFormModified) window.setFormModified(true)

        // Show the "no mappings" message if there are no mappings
        if (mappingsContainer.querySelectorAll(".mapping-pair").length === 0) {
          noMappingsMessage.style.display = "block"
        }

        if (window.recalculateAccuracy) window.recalculateAccuracy()
      })
    }
  }

  // Function to add a new mapping pair
  function addMappingPair(mappingData) {
    if (noMappingsMessage) {
      noMappingsMessage.style.display = "none"
    }

    const newMapping = template
      .replace(/\[@Model\.Item1\]|\[-1\]/g, `[${mappingIndex}]`)
      .replace(/{index}/g, mappingIndex)

    const mappingElement = document.createElement("div")
    mappingElement.innerHTML = newMapping

    attachRemoveHandler(mappingElement)

    // Add change listeners to new inputs
    mappingElement.querySelectorAll("input, textarea, select").forEach((input) => {
      input.addEventListener("change", () => {
        if (window.setFormModified) window.setFormModified(true)
        if (window.recalculateAccuracy) window.recalculateAccuracy()
      })
    })

    // Populate with data if provided
    if (mappingData) {
      ;["sap", "mimosa"].forEach((type) => {
        ;["entityName", "fieldName", "dataType", "description", "fieldLength", "notes", "platform"].forEach((field) => {
          const input = mappingElement.querySelector(`[name$=\".${type}.${field}\"]`)
          if (input && mappingData[type] && mappingData[type][field] !== undefined) {
            if (input.tagName.toLowerCase() === "textarea") {
              input.textContent = mappingData[type][field]
            } else {
              input.value = mappingData[type][field]
            }
          }
        })
      })
    }

    mappingsContainer.appendChild(mappingElement)
    mappingIndex++
    renumberMappings()
  }

  // Renumber mapping input names for proper model binding
  function renumberMappings() {
    document.querySelectorAll(".mapping-pair").forEach((pair, idx) => {
      pair.querySelectorAll("input, textarea, select").forEach((field) => {
        field.name = field.name.replace(/mappings\[\d+\]/g, `mappings[${idx}]`)
        if (field.id) {
          field.id = field.id.replace(/_\d+$/, `_${idx}`)
        }
      })
    })
    mappingIndex = document.querySelectorAll(".mapping-pair").length
  }

  // Expose functions globally for cross-file access
  window.addMappingPair = addMappingPair
  window.renumberMappings = renumberMappings
})
