// Historical data modal functionality
document.addEventListener("DOMContentLoaded", () => {
  const historicalDataModal = document.getElementById("historicalDataModal")

  if (!historicalDataModal) return

  // Historical Data Modal: show and fetch
  historicalDataModal.addEventListener("show.bs.modal", async () => {
    const detailsDiv = document.getElementById("historicalDataDetails")
    detailsDiv.innerHTML = '<div class="text-center text-muted py-4">Loading...</div>'

    try {
      const resp = await fetch("/Home/FetchHistoricalData")
      const data = await resp.json()

      if (!data || data.length === 0) {
        detailsDiv.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-clock-history fs-1 text-primary mb-2"></i>
                        <div>No historical data to display yet.</div>
                    </div>`
        return
      }

      // Sort newest first by createdAt
      data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
        return dateB - dateA
      })

      let html = ""
      data.forEach((entry, i) => {
        const collapseId = `systemMappingContent${i}`

        let badgeClass = "bg-success"
        let emoji = '<i class="bi bi-emoji-smile"></i>'
        if (entry.accuracyRate < 35) {
          badgeClass = "bg-danger"
          emoji = '<i class="bi bi-emoji-frown"></i>'
        } else if (entry.accuracyRate < 70) {
          badgeClass = "bg-warning text-dark"
          emoji = '<i class="bi bi-emoji-neutral"></i>'
        }

        html += `
                    <div class="mb-4">
                        <h6 class="fw-bold mb-1 d-flex justify-content-between align-items-center toggle-heading"
                            data-bs-toggle="collapse"
                            href="#${collapseId}"
                            role="button"
                            aria-expanded="false"
                            aria-controls="${collapseId}">
                            <span class="d-flex align-items-center">
                                <i class="bi bi-chevron-right me-2 toggle-icon"></i>
                                <span class="badge me-4 ${entry.accuracyResult?.accuracyRate >= 60 ? "bg-success" : entry.accuracyResult?.accuracyRate >= 35 ? "bg-warning text-dark" : "bg-danger"}"
                                    style="font-size:1em; width:70px;">${entry.accuracyResult?.accuracyRate !== undefined && entry.accuracyResult?.accuracyRate !== null ? entry.accuracyResult.accuracyRate + "%" : "N/A"}
                                </span>
                                <span class="fw-semibold text-dark me-2" style="width:700px">${entry.prompt ? entry.prompt : "(No prompt)"}</span>
                            </span>
                            <span class="d-flex align-items-center px-2 py-1 rounded bg-light border" style="font-size:0.95em;">
                                <small class="text-secondary">${entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "N/A"}</small>
                                <span class="mx-1 text-secondary">|</span>
                                <small class="text-secondary">${entry.LLMType || ""}</small>
                            </span>
                        </h6>

                        <div class="collapse" id="${collapseId}">
                            <div class="card shadow-sm border-0 mb-3 modern-metrics-card">
                                <div class="card-body p-3">
                                    <div class="row g-3 align-items-center">
                                        <div class="col-12 col-md-4 text-center mb-3 mb-md-0">
                                            <div class="display-5 fw-bold text-primary">
                                                <i class="bi bi-graph-up-arrow"></i>
                                                <span>${entry.accuracyResult && entry.accuracyResult.accuracyRate !== undefined && entry.accuracyResult.accuracyRate !== null ? entry.accuracyResult.accuracyRate : "N/A"}%</span>
                                            </div>
                                            <div class="fw-semibold">Overall Accuracy <i class="bi bi-info-circle ms-1 text-primary"data-bs-toggle="tooltip" title="A total accuracy score is calculated by taking the metrics, SAP Schema Similarity, MIMOSA Schema Similarity, Description Similarity and Data type Similarity but not Table coverage and averaging their scores."></i></div>
                                        </div>
                                        <div class="col-12 col-md-8">
                                            <div class="row g-2">
                                                <div class="col-12 col-sm-6">
                                                    <div class="metric-label">Description Similarity</div>
                                                    <div class="metric-value"><i class="bi bi-file-earmark-text" data-bs-toggle="tooltip" title="Description similarity compares the meaning of descriptions across a mapping to see if the fields are likely to contain similar information"></i>
                                                    <strong>${entry.accuracyResult && entry.accuracyResult.descriptionSimilarity !== undefined && entry.accuracyResult.descriptionSimilarity !== null ? entry.accuracyResult.descriptionSimilarity : "N/A"}%</strong></div>
                                                </div>
                                                <div class="col-12 col-sm-6">
                                                    <div class="metric-label">MIMOSA Schema Similarity</div>
                                                    <div class="metric-value"><i class="bi bi-diagram-3" data-bs-toggle="tooltip" title="MIMOSA schema similarity compares the MIMOSA side of the mapping to to the schema to see if it is a valid field."></i>
                                                    <strong>${entry.accuracyResult && entry.accuracyResult.mimosaSimilarity !== undefined && entry.accuracyResult.mimosaSimilarity !== null ? entry.accuracyResult.mimosaSimilarity : "N/A"}%</strong></div>
                                                </div>
                                                <div class="col-12 col-sm-6">
                                                    <div class="metric-label">Data Type Similarity</div>
                                                    <div class="metric-value"><i class="bi bi-list-check" data-bs-toggle="tooltip" title="DataType compares the data type between mapped fields to see if they are likely to be able to contain similar data."></i>
                                                    <strong>${entry.accuracyResult && entry.accuracyResult.dataType !== undefined && entry.accuracyResult.dataType !== null ? entry.accuracyResult.dataType : "N/A"}%</strong></div>
                                                </div>
                                                <div class="col-12 col-sm-6">
                                                    <div class="metric-label">SAP Schema Similarity</div>
                                                    <div class="metric-value"><i class="bi bi-diagram-2" data-bs-toggle="tooltip" title="SAP schema similarity compares the SAP side of the mapping to to the schema to see if it is a valid field"></i>
                                                    <strong>${entry.accuracyResult && entry.accuracyResult.sapSimilarity !== undefined && entry.accuracyResult.sapSimilarity !== null ? entry.accuracyResult.sapSimilarity : "N/A"}%</strong></div>
                                                </div>                                                            
                                                <div class="col-12 col-sm-6 ms-auto">
                                                    <div class="metric-label">Table Coverage</div>
                                                    <div class="metric-value"><i class="bi bi-exclamation-circle" data-bs-toggle="tooltip" title="Indicates the percentage of base tables that are currently covered by defined mappings."></i>
                                                    <strong>${entry.accuracyResult && entry.accuracyResult.infoOmitted !== undefined && entry.accuracyResult.infoOmitted !== null ? entry.accuracyResult.infoOmitted : "N/A"}%</strong></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="card mb-4">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5>Mapping Pairs</h5>
                                </div>
                                ${
                                  Array.isArray(entry.mappings) && entry.mappings.length > 0
                                    ? `<div class="card-body" style="max-height: 800px; overflow-y: auto;">` +
                                      entry.mappings
                                        .map((m, idx) => {
                                          const pairAcc =
                                            (entry.accuracySingleMappingPair && entry.accuracySingleMappingPair[idx]) ||
                                            null
                                          return `
                                            <div class="card mb-3 shadow-sm">
                                                <div class="card-body">
                                                    <div class="row">
                                                        <div class="col-md-6 border-end">
                                                            <h6 class="fw-bold text-primary mb-2">SAP</h6>
                                                            <div><strong>Entity:</strong> ${m.sap.entityName || ""}</div>
                                                            <div><strong>Field:</strong> ${m.sap.fieldName || ""}</div>
                                                            <div><strong>Description:</strong> ${m.sap.description || ""}</div>
                                                            <div><strong>Type:</strong> ${m.sap.dataType || ""}</div>
                                                            <div><strong>Length:</strong> ${m.sap.fieldLength || ""}</div>
                                                            <div><strong>Notes:</strong> ${m.sap.notes || ""}</div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <h6 class="fw-bold text-success mb-2">MIMOSA</h6>
                                                            <div><strong>Entity:</strong> ${m.mimosa.entityName || ""}</div>
                                                            <div><strong>Field:</strong> ${m.mimosa.fieldName || ""}</div>
                                                            <div><strong>Description:</strong> ${m.mimosa.description || ""}</div>
                                                            <div><strong>Type:</strong> ${m.mimosa.dataType || ""}</div>
                                                            <div><strong>Length:</strong> ${m.mimosa.fieldLength || ""}</div>
                                                            <div><strong>Notes:</strong> ${m.mimosa.notes || ""}</div>
                                                        </div>
                                                    </div>
                                                    <div class="row mt-3">
                                                        <div class="col-12">
                                                            <div class="bg-light rounded p-2">
                                                                <span class="fw-semibold">Mapping Pair Accuracy Metrics:</span><br>
                                                                ${
                                                                  pairAcc
                                                                    ? `
                                                                    <div class="mt-2 pt-2 accuracy-details-metrics">
                                                                        <div class="row g-1">
                                                                            <div class="col-6 col-md-4 mb-1">
                                                                                <div class="accuracy-metric-box">
                                                                                    <span class="metric-label"><i class="bi bi-file-earmark-text" data-bs-toggle="tooltip" title="Description similarity compares the meaning of descriptions across a mapping to see if the fields are likely to contain similar information"></i> Desc. Sim.</span>
                                                                                    <span class="metric-value">${pairAcc.descriptionSimilarity !== undefined && pairAcc.descriptionSimilarity !== null ? pairAcc.descriptionSimilarity : "N/A"}%</span>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-6 col-md-4 mb-1">
                                                                                <div class="accuracy-metric-box">
                                                                                    <span class="metric-label"><i class="bi bi-diagram-2" data-bs-toggle="tooltip" title="SAP schema similarity compares the SAP side of the mapping to to the schema to see if it is a valid field"></i> SAP Sim.</span>
                                                                                    <span class="metric-value">${pairAcc.sapSimilarity !== undefined && pairAcc.sapSimilarity !== null ? pairAcc.sapSimilarity : "N/A"}%</span>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-6 col-md-4 mb-1">
                                                                                <div class="accuracy-metric-box">
                                                                                    <span class="metric-label"><i class="bi bi-diagram-3" data-bs-toggle="tooltip" title="MIMOSA schema similarity compares the MIMOSA side of the mapping to to the schema to see if it is a valid field."></i> MIMOSA Sim.</span>
                                                                                    <span class="metric-value">${pairAcc.mimosaSimilarity !== undefined && pairAcc.mimosaSimilarity !== null ? pairAcc.mimosaSimilarity : "N/A"}%</span>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-6 col-md-6 mb-1">
                                                                                <div class="accuracy-metric-box">
                                                                                    <span class="metric-label"><i class="bi bi-list-check" data-bs-toggle="tooltip" title="DataType compares the data type between mapped fields to see if they are likely to be able to contain similar data."></i> Data Type</span>
                                                                                    <span class="metric-value">${pairAcc.dataType !== undefined && pairAcc.dataType !== null ? pairAcc.dataType : "N/A"}%</span>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-6 col-md-6 mb-1">
                                                                                <div class="accuracy-metric-box">
                                                                                    <span class="metric-label"><i class="bi bi-exclamation-circle" data-bs-toggle="tooltip" title=" At an single mapping level it performs same check but only uses the table for that mapping i.e MANDT from table AUFK will only look for fields with table AUFK in the mappings generated, giving an individual table coverage metric."></i> Table Coverage</span>
                                                                                    <span class="metric-value">${pairAcc.infoOmitted !== undefined && pairAcc.infoOmitted !== null ? pairAcc.infoOmitted : "N/A"}%</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                `
                                                                    : '<span class="text-muted">No pair accuracy results.</span>'
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        `
                                        })
                                        .join("") +
                                      `</div>`
                                    : `<div class="text-center text-muted">No mappings available.</div>`
                                }
                            </div>
                        </div>
                    </div>
                `
      })
      detailsDiv.innerHTML = html
    } catch (e) {
      detailsDiv.innerHTML = `<div class="alert alert-danger">Failed to load historical data.</div>`
    }
  })

  // Historical data button handler
  const historicalDataBtn = document.getElementById("historicalData")
  if (historicalDataBtn) {
    historicalDataBtn.addEventListener("click", (e) => {
      e.preventDefault()
      const bootstrap = window.bootstrap // Declare the bootstrap variable
      const modal = new bootstrap.Modal(historicalDataModal)
      modal.show()
    })
  }
})
