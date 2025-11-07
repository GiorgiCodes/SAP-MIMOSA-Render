// AI Assistant functionality
document.addEventListener("DOMContentLoaded", () => {
  const aiPrompt = document.getElementById("aiPrompt")
  const aiLLMType = document.getElementById("aiLLMType")
  const askAiBtn = document.getElementById("askAiBtn")
  const aiResponseArea = document.getElementById("aiResponseArea")

  if (!askAiBtn) return

  // Ask AI button handler
  askAiBtn.addEventListener("click", async () => {
    aiResponseArea.innerHTML = ""
    const prompt = aiPrompt.value.trim()
    const llmType = aiLLMType.value
    const useExisting = document.getElementById("checkBx").checked

    // Validate inputs
    if (!prompt || !llmType) {
      aiResponseArea.innerHTML = `<div class="alert alert-danger">${!prompt ? "Please enter a prompt." : ""}
            ${!prompt && !llmType ? "<br>" : ""}${!llmType ? "Please select a model." : ""}</div>`
      return
    }

    const requestBody = { prompt, llmType }

    // Collect existing prompt history
    const promptHistoryInput = document.getElementById("promptHistoryJson")
    let existingPromptHistory = []
    if (promptHistoryInput && promptHistoryInput.value) {
      try {
        existingPromptHistory = JSON.parse(promptHistoryInput.value)
      } catch (e) {
        console.warn("Failed to parse existing promptHistory:", e)
        existingPromptHistory = []
      }
    }

    // If checkbox is checked, collect existing mapping pairs
    if (useExisting) {
      const mappings = []
      document.querySelectorAll(".mapping-pair").forEach((pair) => {
        const getValue = (name) => pair.querySelector(`[name*="${name}"]`)?.value || ""

        mappings.push({
          sap: {
            platform: getValue("sap.platform"),
            entityName: getValue("sap.entityName"),
            fieldName: getValue("sap.fieldName"),
            description: getValue("sap.description"),
            dataType: getValue("sap.dataType"),
            notes: getValue("sap.notes"),
            fieldLength: getValue("sap.fieldLength"),
          },
          mimosa: {
            platform: getValue("mimosa.platform"),
            entityName: getValue("mimosa.entityName"),
            fieldName: getValue("mimosa.fieldName"),
            description: getValue("mimosa.description"),
            dataType: getValue("mimosa.dataType"),
            notes: getValue("mimosa.notes"),
            fieldLength: getValue("mimosa.fieldLength"),
          },
        })
      })

      requestBody.mappings = mappings
      requestBody.promptHistory = existingPromptHistory
    } else {
      requestBody.promptHistory = []
    }

    // Read existing prompts from hidden input
    const hiddenPromptInput = document.getElementById("prompts")
    let existingPrompts = hiddenPromptInput?.value?.split("\n").filter((p) => p.trim()) || []

    // Add the new prompt to history
    if (useExisting) {
      existingPrompts.push(prompt)
    } else {
      existingPrompts = [prompt]
    }

    // Update the hidden input value
    if (hiddenPromptInput) {
      hiddenPromptInput.value = existingPrompts.join("\n")
    }
    requestBody.prompts = existingPrompts

    // Include system prompt
    const systemPromptHidden = document.getElementById("systemPromptHidden")
    requestBody.systemPrompt = systemPromptHidden ? systemPromptHidden.value : ""

    // Send request to AI
    aiResponseArea.innerHTML =
      '<div class="spinner-border text-primary" role="status"><span class="visually-hidden"></span></div>'
    try {
      const resp = await fetch("/Home/AskAI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      const data = await resp.json()
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else if (data.message) {
        aiResponseArea.innerHTML = '<div class="alert alert-danger">' + data.message + "</div>"
      } else {
        aiResponseArea.innerHTML = '<div class="alert alert-danger">AI did not return a valid mapping.</div>'
      }
    } catch (e) {
      aiResponseArea.innerHTML = '<div class="alert alert-danger">Error communicating with AI: ' + e + "</div>"
    }
  })
})
