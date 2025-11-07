// Checkbox handler for changing prompt placeholder text
document.addEventListener("DOMContentLoaded", () => {
  const mappingCheckBx = document.getElementById("checkBx")
  const aiPrompt = document.getElementById("aiPrompt")

  if (mappingCheckBx && aiPrompt) {
    mappingCheckBx.addEventListener("change", () => {
      aiPrompt.placeholder = mappingCheckBx.checked
        ? "Provide feedback to improve existing mapping"
        : "Enter prompt to generate initial mapping"
    })
  }
})
