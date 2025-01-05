import { startCommand } from './startCommand'
import { modelCommand, setupModelCallbacks } from './modelCommand'
import { helpCommand } from './helpCommand'
import { generateCommand } from './generateCommand'

// Initialize command callbacks
setupModelCallbacks()

// Export all available commands
export const commands = [startCommand, modelCommand, helpCommand, generateCommand]
