import { initializeApp } from './utils/appUtils'

// Initialize the application with proper error handling and cleanup
initializeApp().catch((error) => {
  console.error('Fatal error during application initialization:', error)
  process.exit(1)
})
