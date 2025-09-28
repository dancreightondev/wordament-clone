import { Settings } from '~/types/settings'

export const serializeSettings = (settings: Settings) => {
  return Object.values(settings)
    .filter((setting) => setting.serializable)
    .map((setting) => {
      if (typeof setting.value === 'boolean') {
        return `${setting.key}${setting.value ? 1 : 0}`
      }
      return `${setting.key}${setting.value}`
    })
    .join('')
}
