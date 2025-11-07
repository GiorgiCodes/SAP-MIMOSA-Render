// Historical data display functionality
document.addEventListener("DOMContentLoaded", () => {
  const bootstrap = window.bootstrap // Declare the bootstrap variable

  document.querySelectorAll(".prompt-history-item").forEach((item) => {
    item.addEventListener("click", async function () {
      const createdAt = this.getAttribute("data-createdat")
      const mapID = this.getAttribute("data-mapid")
      const source = this.getAttribute("data-source")
      if (!createdAt) return

      const modal = new bootstrap.Modal(document.getElementById("historyModal"))
      document.getElementById("historyModalBody").innerHTML = "Loading..."
      modal.show()

      try {
        let resp
        if (source === "sapmimosa" && mapID) {
          resp = await fetch(`/Home/GetMappingById?mapID=${mapID}`)
        } else {
          resp = await fetch(`/Home/FetchHistoricalData?createdDate=${encodeURIComponent(createdAt)}`)
        }

        if (resp.ok) {
          const data = await resp.json()
          document.getElementById("historyModalBody").innerHTML = renderHistoricalCardView(data)
        } else {
          document.getElementById("historyModalBody").innerHTML = "Failed to fetch historical data."
        }
      } catch (e) {
        document.getElementById("historyModalBody").innerHTML = "Error fetching data: " + e
      }
    })
  })

  // Render mapping details
  function renderMappingDetails(labelMap) {
    return Object.entries(labelMap)
      .map(
        ([label, value]) =>
          `<div class="mapping-item"><div class="mapping-label">${label}:</div><div class="mapping-value">${value ?? ""}</div></div>`,
      )
      .join("")
  }

  // Render accuracy metrics
  function renderAccuracyMetrics(acc, title = "") {
    if (!acc) return ""

    function getBadgeCls(rate) {
      if (rate < 35) return "bg-danger"
      if (rate < 70) return "bg-warning text-dark"
      return "bg-success"
    }
    const badgeCls = getBadgeCls(acc.accuracyRate)
    document.getElementById("historyModalLabel").textContent = title
    return `
            <div class="card shadow-sm border-0 mb-3 modern-metrics-card">
                <div class="card-body p-3">
                    <div class="row g-3 align-items-center">
                        <div class="col-12 col-md-4 text-center mb-3 mb-md-0">
                            <div class="display-5 fw-bold text-primary">
                                <i class="bi bi-graph-up-arrow"></i>
                                <span>${acc.accuracyRate ?? 0}%</span>
                            </div>
                            <div class="fw-semibold">Overall Accuracy <i class="bi bi-info-circle ms-1 text-primary" data-bs-toggle="tooltip" title="A total accuracy score is calculated by taking the metrics, SAP Schema Similarity, MIMOSA Schema Similarity, Description Similarity and Data type Similarity but not Table coverage and averaging their scores."></i></div>
                            <span class="badge ${badgeCls} px-3 py-2 fs-6 mt-2">
                                ${acc.accuracyRate ?? 0}%
                            </span>
                        </div>
                        <div class="col-12 col-md-8">
                            <div class="row g-2">
                                <div class="col-12 col-sm-6">
                                    <div class="metric-label">Description Similarity</div>
                                    <div class="metric-value"><i class="bi bi-file-earmark-text" data-bs-toggle="tooltip" title="Description similarity compares the meaning of descriptions across a mapping to see if the fields are likely to contain similar information"></i> <strong>${acc.descriptionSimilarity ?? 0}%</strong></div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="metric-label">MIMOSA Schema Similarity</div>
                                    <div class="metric-value"><i class="bi bi-diagram-3" data-bs-toggle="tooltip" title="MIMOSA Schema similarity compares the MIMOSA side of the mapping to to the schema to see if it is a valid field."></i> <strong>${acc.mimosaSimilarity ?? 0}%</strong></div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="metric-label">Data Type Similarity</div>
                                    <div class="metric-value"><i class="bi bi-list-check" data-bs-toggle="tooltip" title="DataType compares the data type between mapped fields to see if they are likely to be able to contain similar data."></i> <strong>${acc.dataType ?? 0}%</strong></div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="metric-label">SAP Schema Similarity</div>
                                    <div class="metric-value"><i class="bi bi-diagram-2" data-bs-toggle="tooltip" title="SAP schema similarity compares the SAP side of the mapping to to the schema to see if it is a valid field"></i> <strong>${acc.sapSimilarity ?? 0}%</strong></div>
                                </div>
                                <div class="col-12 col-sm-6 ms-auto">
                                    <div class="metric-label d-flex align-items-center" data-bs-toggle="collapse" data-bs-target="#coverageDetails" style="cursor: pointer;">
                                        Table Coverage
                                        <i class="fas fa-chevron-right ms-2 toggle-icon" id="chevronIcon" style="color:blue; display: inline-block; transition: transform 0.3s;"></i>
                                    </div>
                                    <div class="metric-value"><i class="bi bi-exclamation-circle" data-bs-toggle="tooltip" title="Indicates the percentage of base tables that are currently covered by defined mappings."></i> <strong>${acc.infoOmitted ?? 0}%</strong></div>
                                </div>
                                        <div class="collapse mt-2" id="coverageDetails">
                                <div>
                                    ${(() => {
                                      if (acc.missingFields && Object.keys(acc.missingFields).length > 0) {
                                        let html = ""
                                        for (const [table, fields] of Object.entries(acc.missingFields)) {
                                          html += `<b>Table ${table}</b>: ${fields.join(", ")}<br>`
                                        }
                                        return `<div class="form-control" style="min-height: 80px; white-space: pre-wrap;">${html}</div>`
                                      } else {
                                        return `<div class="form-control" style="min-height: 80px; white-space: pre-wrap;">No missing fields.</div>`
                                      }
                                    })()}
                                    <input type="hidden" id="missingFieldsJson" name="accuracyResult.missingFieldsJson" value="" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
  }

  // Render single mapping pair accuracy metrics
  function renderSingleMappingPairAccuracy(acc) {
    if (!acc) return ""
    return `
            <div class="mt-2 pt-2 accuracy-details-metrics">
                <div class="fw-semibold mb-2 text-primary"><i class="bi bi-bar-chart"></i>Mapping Pair Accuracy Details</div>
                <div class="row g-1">
                    <div class="col-6 col-md-4 mb-1">
                        <div class="accuracy-metric-box">
                            <span class="metric-label"><i class="bi bi-file-earmark-text" data-bs-toggle="tooltip" title="Description similarity compares the meaning of descriptions across a mapping to see if the fields are likely to contain similar information"></i> Desc. Sim.</span>
                            <span class="metric-value">${acc.descriptionSimilarity ?? 0}%</span>
                        </div>
                    </div>
                    <div class="col-6 col-md-4 mb-1">
                        <div class="accuracy-metric-box">
                            <span class="metric-label"><i class="bi bi-diagram-2" data-bs-toggle="tooltip" title="SAP schema similarity compares the SAP side of the mapping to to the schema to see if it is a valid field"></i> SAP Sim.</span>
                            <span class="metric-value">${acc.sapSimilarity ?? 0}%</span>
                        </div>
                    </div>
                    <div class="col-6 col-md-4 mb-1">
                        <div class="accuracy-metric-box">
                            <span class="metric-label"><i class="bi bi-diagram-3" data-bs-toggle="tooltip" title="MIMOSA Schema similarity compares the MIMOSA side of the mapping to to the schema to see if it is a valid field."></i> MIMOSA Sim.</span>
                            <span class="metric-value">${acc.mimosaSimilarity ?? 0}%</span>
                        </div>
                    </div>
                    <div class="col-6 col-md-4 mb-1">
                        <div class="accuracy-metric-box">
                            <span class="metric-label"><i class="bi bi-list-check" data-bs-toggle="tooltip" title="DataType compares the data type between mapped fields to see if they are likely to be able to contain similar data."></i> Data Type</span>
                            <span class="metric-value">${acc.dataType ?? 0}%</span>
                        </div>
                    </div>
                    <div class="col-6 col-md-4 mb-1">
                        <div class="accuracy-metric-box">
                            <span class="metric-label"><i class="bi bi-exclamation-circle" data-bs-toggle="tooltip" title=" At an single mapping level it performs same check but only uses the table for that mapping i.e MANDT from table AUFK will only look for fields with table AUFK in the mappings generated, giving an individual table coverage metric."></i> Table Coverage</span>
                            <span class="metric-value">${acc.infoOmitted ?? 0}%</span>
                        </div>
                    </div>

                </div>
            </div>
        `
  }

  // Main render function
  function renderHistoricalCardView(dataArr) {
    let doc
    if (Array.isArray(dataArr)) {
      if (dataArr.length === 0) {
        return '<div class="alert alert-warning">No historical data found for this prompt.</div>'
      }
      doc = dataArr[0]
    } else if (typeof dataArr === "object" && dataArr !== null) {
      doc = dataArr
    } else {
      return '<div class="alert alert-warning">No historical data found for this prompt.</div>'
    }
    let html = ""

    // Overall accuracy
    if (doc.accuracyResult) {
      html += renderAccuracyMetrics(doc.accuracyResult, doc.prompt)
    }

    // Mapping pairs
    if (doc.mappings && Array.isArray(doc.mappings)) {
      html +=
        `<div class="row">` +
        doc.mappings
          .map(
            (mapping, idx) => `
                    <div class="col-12 mb-3">
                        <div class="card mapping-pair-card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">Mapping Pair ${idx + 1}</h6>
                                <div class="badge bg-light text-dark">Field Mapping</div>
                            </div>
                            <div class="card-body p-0">
                                <div class="row g-0">
                                    <div class="col-md-6 sap-side">
                                        <div class="p-3 h-100 border-end-md">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="sap-indicator me-2"></div>
                                                <h6 class="mb-0">SAP</h6>
                                            </div>
                                            <div class="mapping-details">
                                                ${renderMappingDetails({
                                                  Table: mapping.sap.entityName,
                                                  Field: `<span class="fw-semibold">${mapping.sap.fieldName}</span>`,
                                                  Description: mapping.sap.description,
                                                  "Data Type": mapping.sap.dataType,
                                                  Length: mapping.sap.fieldLength,
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mimosa-side">
                                        <div class="p-3 h-100">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="mimosa-indicator me-2"></div>
                                                <h6 class="mb-0">MIMOSA</h6>
                                            </div>
                                            <div class="mapping-details">
                                                ${renderMappingDetails({
                                                  Table: mapping.mimosa.entityName,
                                                  Field: `<span class="fw-semibold">${mapping.mimosa.fieldName}</span>`,
                                                  Description: mapping.mimosa.description,
                                                  "Data Type": mapping.mimosa.dataType,
                                                  Length: mapping.mimosa.fieldLength,
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                ${renderSingleMappingPairAccuracy(doc.accuracySingleMappingPair?.[idx])}
                            </div>
                        </div>
                    </div>
                `,
          )
          .join("") +
        `</div>`
    }
    return html
  }
})
