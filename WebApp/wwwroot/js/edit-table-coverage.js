// Handle table coverage collapse/expand animation
document.addEventListener("DOMContentLoaded", () => {
  const collapseEl = document.getElementById("coverageDetails")
  const icon = document.getElementById("chevronIcon")

  if (collapseEl && icon) {
    collapseEl.addEventListener("show.bs.collapse", () => {
      icon.style.transform = "rotate(90deg)"
    })

    collapseEl.addEventListener("hide.bs.collapse", () => {
      icon.style.transform = "rotate(0deg)"
    })
  }
})
