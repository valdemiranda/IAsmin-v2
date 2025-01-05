/**
 * Types for the user repository operations
 */
export type UserCreateData = {
  id: string
  username?: string
}

export type UserUpdateAuthorizationData = {
  id: string
  authorized: boolean
}
