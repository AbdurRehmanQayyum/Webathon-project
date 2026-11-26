// Applies the saved theme before the first paint
;(function () {
  var theme = null
  try {
    theme = localStorage.getItem('campus-connect-theme')
  } catch {
    theme = null
  }
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  var dark = theme === 'dark' || ((!theme || theme === 'system') && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
})()
