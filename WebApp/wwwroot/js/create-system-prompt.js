// System prompt modal functionality
document.addEventListener("DOMContentLoaded", () => {
    console.log("[v0] System prompt script loaded")

    const aiPrompt = document.getElementById("aiPrompt")
    const modalPromptInput = document.getElementById("modalPromptInput")
    const modalSystemPrompt = document.getElementById("modalSystemPrompt")
    const savePromptBtn = document.getElementById("savePromptBtn")
    const promptModal = document.getElementById("promptModal")
    const systemPromptHidden = document.getElementById("systemPromptHidden")

    console.log("[v0] Elements found:", {
        aiPrompt: !!aiPrompt,
        modalPromptInput: !!modalPromptInput,
        modalSystemPrompt: !!modalSystemPrompt,
        savePromptBtn: !!savePromptBtn,
        promptModal: !!promptModal,
        systemPromptHidden: !!systemPromptHidden,
    })

    if (!promptModal) {
        console.error("[v0] Prompt modal not found!")
        return
    }

    // When modal opens, fetch system message and set values
    promptModal.addEventListener("show.bs.modal", () => {
        console.log("[v0] Modal opening: fetching system message...")
        const useExisting = document.getElementById("checkBx")?.checked || false
        const improve = useExisting

        console.log("[v0] Fetching with improveMappings:", improve)

        fetch(`http://127.0.0.1:8000/system_message?improveMappings=${improve}`)
            .then((response) => {
                console.log("[v0] API response status:", response.status)
                console.log("[v0] API response headers:", response.headers)

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }
                return response.json()
            })
            .then((data) => {
                console.log("[v0] System message from API:", data.system_message)
                if (modalSystemPrompt) {
                    modalSystemPrompt.value = data.system_message
                    console.log("[v0] Successfully assigned value to modalSystemPrompt")
                } else {
                    console.error("[v0] modalSystemPrompt element is null")
                }
            })
            .catch((err) => {
                console.error("[v0] Fetch error details:", err)
                console.error("[v0] Error name:", err.name)
                console.error("[v0] Error message:", err.message)

                let errorMessage = "Error loading system prompt.\n\n"

                if (err.name === "TypeError" && err.message.includes("Failed to fetch")) {
                    errorMessage += "Cannot connect to Python API server.\n"
                    errorMessage += "Please ensure:\n"
                    errorMessage += "1. Python FastAPI server is running on http://127.0.0.1:8000\n"
                    errorMessage += "2. Run: python -m uvicorn app:app --reload --port 8000\n"
                    errorMessage += "3. Check CORS settings in your Python backend"
                } else {
                    errorMessage += `Details: ${err.message}`
                }

                if (modalSystemPrompt) {
                    modalSystemPrompt.value = errorMessage
                }
            })

        if (modalPromptInput && aiPrompt) {
            modalPromptInput.value = aiPrompt.value
            console.log("[v0] Set modal prompt input value")
        }

        setTimeout(() => {
            if (modalPromptInput) {
                modalPromptInput.focus()
                console.log("[v0] Focused on modal prompt input")
            }
        }, 300)
    })

    // Save button: assign user/system prompts to fields
    if (savePromptBtn) {
        savePromptBtn.addEventListener("click", () => {
            console.log("[v0] Save button clicked")

            if (aiPrompt && modalPromptInput) {
                aiPrompt.value = modalPromptInput.value
                console.log("[v0] Saved prompt value:", modalPromptInput.value)
            }

            if (systemPromptHidden && modalSystemPrompt) {
                systemPromptHidden.value = modalSystemPrompt.value
                console.log("[v0] Saved system prompt to hidden input")
            }

            // Close the modal
            if (window.bootstrap && window.bootstrap.Modal) {
                const modal = window.bootstrap.Modal.getInstance(promptModal)
                if (modal) {
                    modal.hide()
                    console.log("[v0] Modal closed")
                } else {
                    console.error("[v0] Could not get modal instance")
                }
            } else {
                console.error("[v0] Bootstrap Modal not available")
            }
        })
    } else {
        console.error("[v0] Save button not found!")
    }
})
