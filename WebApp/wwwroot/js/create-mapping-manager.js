// Mapping pair management functionality
document.addEventListener("DOMContentLoaded", () => {
  const mappingsContainer = document.getElementById("mappingsContainer")
  const template = document.getElementById("mappingPairTemplate")?.textContent

  if (!mappingsContainer || !template) return

  // Get initial mapping count from the page
  let mappingIndex = document.querySelectorAll(".mapping-pair").length

  // Attach remove event to a mapping pair
  const attachRemoveHandler = (el) => {
    const removeBtn = el.querySelector(".remove-mapping")
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        el.remove()
        renumberMappings()
      })
    }
  }

  // Renumber mapping input names for proper model binding
  const renumberMappings = () => {
    document.querySelectorAll(".mapping-pair").forEach((pair, idx) => {
      pair.querySelectorAll("input, textarea").forEach((field) => {
        field.name = field.name.replace(/mappings\[\d+\]/g, `mappings[${idx}]`)
      })
    })
  }

  // Add a new mapping pair
  function addMappingPair(mappingData) {
    const newMapping = template.replace(/\[@Model\.Item1\]|\[-1\]/g, `[${mappingIndex}]`)
    const mappingElement = document.createElement("div")
    mappingElement.innerHTML = newMapping
    attachRemoveHandler(mappingElement)

    if (mappingData) {
      ;["sap", "mimosa"].forEach((type) => {
        ;["entityName", "fieldName", "dataType", "description", "fieldLength", "notes", "platform"].forEach((field) => {
          const input = mappingElement.querySelector(`[name$=".${type}.${field}"]`)
          if (input && mappingData[type] && mappingData[type][field] !== undefined) {
            if (input.tagName.toLowerCase() === "textarea") {
              input.textContent = mappingData[type][field]
            } else {
              input.value = mappingData[type][field]
            }
          }
        })
      })

      const allSapFilled = ["entityName", "fieldName", "dataType", "description"].every(
        (f) => (mappingData.sap?.[f] || "").trim() !== "",
      )
      const allMimosaFilled = ["entityName", "fieldName", "dataType", "description"].every(
        (f) => (mappingData.mimosa?.[f] || "").trim() !== "",
      )
      if (!allSapFilled && !allMimosaFilled) return
    }

    mappingsContainer.appendChild(mappingElement)
    mappingIndex++
  }

  // Attach remove handler to all existing mapping pairs
  document.querySelectorAll(".mapping-pair").forEach(attachRemoveHandler)

  // Add new mapping pair button
  const addMappingBtn = document.getElementById("addMapping")
  if (addMappingBtn) {
    addMappingBtn.addEventListener("click", () => {
      addMappingPair()
      renumberMappings()
    })
  }

  // Expose addMappingPair globally for CSV import to use
  window.addMappingPair = addMappingPair
  window.renumberMappings = renumberMappings
})
