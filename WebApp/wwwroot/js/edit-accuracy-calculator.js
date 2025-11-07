// Recalculate accuracy metrics and update UI
document.addEventListener("DOMContentLoaded", () => {
  // Gather all mapping data from DOM
  function gatherMappings() {
    const mappings = []
    document.querySelectorAll(".mapping-pair").forEach((pair) => {
      function getValue(selector) {
        const el = pair.querySelector(selector)
        return el ? el.value : ""
      }
      mappings.push({
        sap: {
          entityName: getValue('[name$=".sap.entityName"]'),
          fieldName: getValue('[name$=".sap.fieldName"]'),
          dataType: getValue('[name$=".sap.dataType"]'),
          description: getValue('[name$=".sap.description"]'),
          fieldLength: getValue('[name$=".sap.fieldLength"]'),
          notes: getValue('[name$=".sap.notes"]'),
          platform: getValue('[name$=".sap.platform"]') || "SAP",
        },
        mimosa: {
          entityName: getValue('[name$=".mimosa.entityName"]'),
          fieldName: getValue('[name$=".mimosa.fieldName"]'),
          dataType: getValue('[name$=".mimosa.dataType"]'),
          description: getValue('[name$=".mimosa.description"]'),
          fieldLength: getValue('[name$=".mimosa.fieldLength"]'),
          notes: getValue('[name$=".mimosa.notes"]'),
          platform: getValue('[name$=".mimosa.platform"]') || "MIMOSA",
        },
      })
    })
    return mappings
  }

  // Recalculate accuracy and update hidden fields
  async function recalculateAccuracy() {
    const mappings = gatherMappings()
    if (mappings.length === 0) return

    try {
      const response = await fetch("/Home/RecalculateAccuracy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mappings),
      })

      if (!response.ok) return

      const data = await response.json()

      // Update hidden form fields
      document.querySelector('[name="accuracyResult.accuracyRate"]').value = data.overall.accuracyRate
      document.querySelector('[name="accuracyResult.descriptionSimilarity"]').value = data.overall.descriptionSimilarity
      document.querySelector('[name="accuracyResult.mimosaSimilarity"]').value = data.overall.mimosaSimilarity
      document.querySelector('[name="accuracyResult.sapSimilarity"]').value = data.overall.sapSimilarity
      document.querySelector('[name="accuracyResult.dataType"]').value = data.overall.dataType
      document.querySelector('[name="accuracyResult.fieldLength"]').value = data.overall.fieldLength
      document.querySelector('[name="accuracyResult.infoOmitted"]').value = data.overall.infoOmitted

      // Update metrics alert display
      const metricsAlert = document.getElementById("metricsAlert")
      if (metricsAlert) {
        metricsAlert.style.display = "block"
        metricsAlert.querySelector(".display-5 span").textContent = data.overall.accuracyRate + "%"

        // Update overall metric values using data-metric attributes
        const overallMetrics = [
          "descriptionSimilarity",
          "mimosaSimilarity",
          "dataType",
          "sapSimilarity",
          "fieldLength",
          "infoOmitted",
        ]

        overallMetrics.forEach((metric) => {
          const el = metricsAlert.querySelector(`[data-metric="${metric}"]`)
          if (el && data.overall[metric] !== null && data.overall[metric] !== undefined) {
            el.textContent = data.overall[metric] + "%"
          }
        })

        // Update accuracy badge
        const badge = document.getElementById("accuracy-badge")
        badge.className = "badge px-3 py-2 fs-6 mt-2"
        let badgeIcon = ""

        if (data.overall.accuracyRate < 35) {
          badge.classList.add("bg-danger")
          badgeIcon = '<i class="bi bi-emoji-frown"></i>'
        } else if (data.overall.accuracyRate < 70) {
          badge.classList.add("bg-warning", "text-dark")
          badgeIcon = '<i class="bi bi-emoji-neutral"></i>'
        } else {
          badge.classList.add("bg-success")
          badgeIcon = '<i class="bi bi-emoji-smile"></i>'
        }

        badge.innerHTML = `${badgeIcon} ${data.overall.accuracyRate}%`
      }

      // Update per-mapping pair metrics dynamically
      if (Array.isArray(data.details)) {
        data.details.forEach((detail, idx) => {
          Object.entries(detail).forEach(([key, value]) => {
            if (
              [
                "descriptionSimilarity",
                "sapSimilarity",
                "mimosaSimilarity",
                "dataType",
                "infoOmitted",
                "fieldLength",
              ].includes(key)
            ) {
              const selector = `.metric-value[data-metric="${key}"][data-index="${idx}"]`
              const span = document.querySelector(selector)
              if (span) {
                span.textContent = value !== null && value !== undefined ? value.toFixed(2) + "%" : ""
              }
            }
          })
        })
      }

      // Update or create accuracySingleMappingPairJson hidden field
      let accuracySingleMappingPairJson = document.getElementById("accuracySingleMappingPairJson")
      if (!accuracySingleMappingPairJson) {
        accuracySingleMappingPairJson = document.createElement("input")
        accuracySingleMappingPairJson.type = "hidden"
        accuracySingleMappingPairJson.id = "accuracySingleMappingPairJson"
        accuracySingleMappingPairJson.name = "accuracySingleMappingPairJson"
        document.querySelector("form").appendChild(accuracySingleMappingPairJson)
      }
      accuracySingleMappingPairJson.value = JSON.stringify(data.details)
    } catch (e) {
      console.error("Error recalculating accuracy:", e)
    }
  }

  // Expose function globally
  window.recalculateAccuracy = recalculateAccuracy
})
